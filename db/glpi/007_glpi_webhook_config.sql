-- Run in a fresh MariaDB batch session with the GLPI database selected.
-- Set @glpi_expected_database and @glpi_webhook_url explicitly in the same session.
-- See docs/07-operations/glpi-webhook-setup.md. Never supply the webhook secret here.
DELIMITER //
BEGIN NOT ATOMIC
    DECLARE category_id INT UNSIGNED;
    DECLARE matches_count INT;
    DECLARE hook_name VARCHAR(255) DEFAULT 'Ticket Manager - Nuevo Ticket Creado';
    DECLARE marker VARCHAR(100) DEFAULT 'GLPI Ticket Manager: managed by migration 007';
    DECLARE payload_template TEXT DEFAULT '{"ticketId": {{ item.id }}}';
    DECLARE lock_name VARCHAR(64);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION, SQLWARNING
    BEGIN
        ROLLBACK;
        DO RELEASE_LOCK(lock_name);
        RESIGNAL;
    END;

    IF DATABASE() IS NULL OR NOT (BINARY DATABASE() <=> BINARY @glpi_expected_database) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Wrong or unspecified target database';
    END IF;
    IF @glpi_webhook_url IS NULL OR @glpi_webhook_url NOT REGEXP
        '^https?://[a-zA-Z0-9.-]+(:[0-9]+)?(/[^[:space:]?#@]*)?/api/integrations/glpi/ticket-created$' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Invalid webhook destination';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM glpi_configs WHERE context='core' AND name='version' AND value LIKE '11.%') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='GLPI 11 schema required';
    END IF;
    SET lock_name=CONCAT('glpi-007:', SHA1(DATABASE()));
    IF NOT (GET_LOCK(lock_name,5) <=> 1) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Migration lock unavailable';
    END IF;
    START TRANSACTION;
    SELECT MAX(id) INTO category_id FROM glpi_webhookcategories
        WHERE webhookcategories_id=0 AND name='Ticket Manager';
    IF category_id IS NULL THEN
        INSERT INTO glpi_webhookcategories
            (webhookcategories_id,name,comment,completename,level,date_creation,date_mod)
        VALUES (0,'Ticket Manager',marker,'Ticket Manager',1,NOW(),NOW());
        SET category_id=LAST_INSERT_ID();
    ELSEIF NOT EXISTS (SELECT 1 FROM glpi_webhookcategories WHERE id=category_id
        AND BINARY comment=BINARY marker AND completename='Ticket Manager' AND level=1) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Category ownership conflict';
    END IF;

    SELECT COUNT(*) INTO matches_count FROM glpi_webhooks
        WHERE name=hook_name OR comment=marker OR url=@glpi_webhook_url;
    IF matches_count=0 THEN
        INSERT INTO glpi_webhooks
            (entities_id,is_recursive,name,comment,webhookcategories_id,itemtype,event,payload,
             use_default_payload,custom_headers,url,http_method,sent_try,expiration,is_active,date_creation,date_mod)
        VALUES (0,1,hook_name,marker,category_id,'Ticket','new',payload_template,
                0,'[]',@glpi_webhook_url,'POST',3,600,0,NOW(),NOW());
    ELSEIF matches_count<>1 OR NOT EXISTS (SELECT 1 FROM glpi_webhooks
        WHERE name=hook_name AND BINARY comment=BINARY marker AND BINARY url=BINARY @glpi_webhook_url
          AND webhookcategories_id=category_id AND itemtype='Ticket' AND event='new'
          AND BINARY payload=BINARY payload_template AND use_default_payload=0 AND custom_headers='[]'
          AND entities_id=0 AND is_recursive=1 AND http_method='POST' AND sent_try=3 AND expiration=600
          AND is_active=0 AND secret IS NULL AND use_oauth=0 AND use_cra_challenge=0
          AND save_response_body=0 AND log_in_item_history=0) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Webhook ownership or configuration conflict';
    END IF;
    COMMIT;
    DO RELEASE_LOCK(lock_name);
END//
DELIMITER ;
