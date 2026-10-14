/*M!999999\- enable the sandbox mode */ 

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `glpi_agents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_agents` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `deviceid` varchar(255) NOT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `agenttypes_id` int(10) unsigned NOT NULL,
  `last_contact` timestamp NULL DEFAULT NULL,
  `version` varchar(255) DEFAULT NULL,
  `locked` tinyint(4) NOT NULL DEFAULT 0,
  `itemtype` varchar(100) NOT NULL,
  `items_id` int(10) unsigned NOT NULL,
  `useragent` varchar(255) DEFAULT NULL,
  `tag` varchar(255) DEFAULT NULL,
  `port` varchar(6) DEFAULT NULL,
  `remote_addr` varchar(255) DEFAULT NULL,
  `threads_networkdiscovery` int(11) NOT NULL DEFAULT 1,
  `threads_networkinventory` int(11) NOT NULL DEFAULT 1,
  `timeout_networkdiscovery` int(11) NOT NULL DEFAULT 0,
  `timeout_networkinventory` int(11) NOT NULL DEFAULT 0,
  `use_module_wake_on_lan` tinyint(4) NOT NULL DEFAULT 0,
  `use_module_computer_inventory` tinyint(4) NOT NULL DEFAULT 0,
  `use_module_esx_remote_inventory` tinyint(4) NOT NULL DEFAULT 0,
  `use_module_remote_inventory` tinyint(4) NOT NULL DEFAULT 0,
  `use_module_network_inventory` tinyint(4) NOT NULL DEFAULT 0,
  `use_module_network_discovery` tinyint(4) NOT NULL DEFAULT 0,
  `use_module_package_deployment` tinyint(4) NOT NULL DEFAULT 0,
  `use_module_collect_data` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `deviceid` (`deviceid`),
  KEY `name` (`name`),
  KEY `agenttypes_id` (`agenttypes_id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `item` (`itemtype`,`items_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_agents` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_agents` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_agenttypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_agenttypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_agenttypes` DISABLE KEYS */;
INSERT INTO `glpi_agenttypes` VALUES
(1,'Core');
/*!40000 ALTER TABLE `glpi_agenttypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_alerts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_alerts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `itemtype` varchar(100) NOT NULL,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `type` int(11) NOT NULL DEFAULT 0,
  `date` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`itemtype`,`items_id`,`type`),
  KEY `type` (`type`),
  KEY `date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_alerts` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_alerts` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_apiclients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_apiclients` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT 0,
  `ipv4_range_start` bigint(20) DEFAULT NULL,
  `ipv4_range_end` bigint(20) DEFAULT NULL,
  `ipv6` varchar(255) DEFAULT NULL,
  `app_token` varchar(255) DEFAULT NULL,
  `app_token_date` timestamp NULL DEFAULT NULL,
  `dolog_method` tinyint(4) NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `is_active` (`is_active`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_apiclients` DISABLE KEYS */;
INSERT INTO `glpi_apiclients` VALUES
(1,0,1,'full access from localhost',NULL,NULL,1,2130706433,2130706433,'::1',NULL,NULL,0,NULL),
(2,0,0,'glpi-ticket-manager','2026-10-13 17:07:23','2026-10-13 17:07:23',1,NULL,NULL,NULL,'cWpUi+/03MFwBZ44DQELqbyWh9mW0zbBv4GlwMR32l1jqewUTgSBUsWAnQ8+zLAykcXEsjhoICqA8/dqc8Db3T/QzPhXjj13jrU2QvLBFnU=',NULL,0,'');
/*!40000 ALTER TABLE `glpi_apiclients` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_applianceenvironments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_applianceenvironments` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_applianceenvironments` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_applianceenvironments` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_appliances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_appliances` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `name` varchar(255) NOT NULL DEFAULT '',
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `appliancetypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `manufacturers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `applianceenvironments_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id_tech` int(10) unsigned NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `states_id` int(10) unsigned NOT NULL DEFAULT 0,
  `externalidentifier` varchar(255) DEFAULT NULL,
  `serial` varchar(255) DEFAULT NULL,
  `otherserial` varchar(255) DEFAULT NULL,
  `contact` varchar(255) DEFAULT NULL,
  `contact_num` varchar(255) DEFAULT NULL,
  `is_helpdesk_visible` tinyint(4) NOT NULL DEFAULT 1,
  `pictures` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`externalidentifier`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `name` (`name`),
  KEY `is_deleted` (`is_deleted`),
  KEY `appliancetypes_id` (`appliancetypes_id`),
  KEY `locations_id` (`locations_id`),
  KEY `manufacturers_id` (`manufacturers_id`),
  KEY `applianceenvironments_id` (`applianceenvironments_id`),
  KEY `users_id` (`users_id`),
  KEY `users_id_tech` (`users_id_tech`),
  KEY `states_id` (`states_id`),
  KEY `serial` (`serial`),
  KEY `otherserial` (`otherserial`),
  KEY `is_helpdesk_visible` (`is_helpdesk_visible`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_appliances` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_appliances` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_appliances_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_appliances_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `appliances_id` int(10) unsigned NOT NULL DEFAULT 0,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(100) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`appliances_id`,`items_id`,`itemtype`),
  KEY `item` (`itemtype`,`items_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_appliances_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_appliances_items` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_appliances_items_relations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_appliances_items_relations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `appliances_items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(100) NOT NULL,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `appliances_items_id` (`appliances_items_id`),
  KEY `item` (`itemtype`,`items_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_appliances_items_relations` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_appliances_items_relations` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_appliancetypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_appliancetypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `name` varchar(255) NOT NULL DEFAULT '',
  `comment` text DEFAULT NULL,
  `externalidentifier` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `externalidentifier` (`externalidentifier`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_appliancetypes` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_appliancetypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_assets_assetdefinitions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_assets_assetdefinitions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `system_name` varchar(255) DEFAULT NULL,
  `label` varchar(255) NOT NULL,
  `icon` varchar(255) DEFAULT NULL,
  `picture` text DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT 0,
  `capacities` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`capacities`)),
  `profiles` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`profiles`)),
  `translations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`translations`)),
  `fields_display` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`fields_display`)),
  `date_creation` timestamp NULL DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `system_name` (`system_name`),
  KEY `label` (`label`),
  KEY `is_active` (`is_active`),
  KEY `date_creation` (`date_creation`),
  KEY `date_mod` (`date_mod`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_assets_assetdefinitions` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_assets_assetdefinitions` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_assets_assetmodels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_assets_assetmodels` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `assets_assetdefinitions_id` int(10) unsigned NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `product_number` varchar(255) DEFAULT NULL,
  `weight` int(11) NOT NULL DEFAULT 0,
  `required_units` int(11) NOT NULL DEFAULT 1,
  `depth` float NOT NULL DEFAULT 1,
  `power_connections` int(11) NOT NULL DEFAULT 0,
  `power_consumption` int(11) NOT NULL DEFAULT 0,
  `max_power` int(11) NOT NULL DEFAULT 0,
  `is_half_rack` tinyint(4) NOT NULL DEFAULT 0,
  `picture_front` text DEFAULT NULL,
  `picture_rear` text DEFAULT NULL,
  `pictures` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `assets_assetdefinitions_id` (`assets_assetdefinitions_id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `product_number` (`product_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_assets_assetmodels` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_assets_assetmodels` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_assets_assets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_assets_assets` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `assets_assetdefinitions_id` int(10) unsigned NOT NULL,
  `assets_assetmodels_id` int(10) unsigned NOT NULL DEFAULT 0,
  `assets_assettypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `uuid` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `serial` varchar(255) DEFAULT NULL,
  `otherserial` varchar(255) DEFAULT NULL,
  `contact` varchar(255) DEFAULT NULL,
  `contact_num` varchar(255) DEFAULT NULL,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id_tech` int(10) unsigned NOT NULL DEFAULT 0,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `manufacturers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `states_id` int(10) unsigned NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_template` tinyint(4) NOT NULL DEFAULT 0,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `template_name` varchar(255) DEFAULT NULL,
  `autoupdatesystems_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `last_inventory_update` timestamp NULL DEFAULT NULL,
  `custom_fields` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`custom_fields`)),
  PRIMARY KEY (`id`),
  KEY `assets_assetdefinitions_id` (`assets_assetdefinitions_id`),
  KEY `assets_assetmodels_id` (`assets_assetmodels_id`),
  KEY `assets_assettypes_id` (`assets_assettypes_id`),
  KEY `name` (`name`),
  KEY `uuid` (`uuid`),
  KEY `users_id` (`users_id`),
  KEY `users_id_tech` (`users_id_tech`),
  KEY `locations_id` (`locations_id`),
  KEY `manufacturers_id` (`manufacturers_id`),
  KEY `states_id` (`states_id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `active_assets` (`is_deleted`,`is_template`),
  KEY `is_template` (`is_template`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `autoupdatesystems_id` (`autoupdatesystems_id`),
  KEY `date_creation` (`date_creation`),
  KEY `date_mod` (`date_mod`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_assets_assets` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_assets_assets` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_assets_assets_peripheralassets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_assets_assets_peripheralassets` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `itemtype_asset` varchar(255) NOT NULL,
  `items_id_asset` int(10) unsigned NOT NULL DEFAULT 0,
  `items_id_peripheral` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype_peripheral` varchar(255) NOT NULL,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `item_asset` (`itemtype_asset`,`items_id_asset`),
  KEY `item_peripheral` (`itemtype_peripheral`,`items_id_peripheral`),
  KEY `is_deleted` (`is_deleted`),
  KEY `is_dynamic` (`is_dynamic`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_assets_assets_peripheralassets` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_assets_assets_peripheralassets` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_assets_assettypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_assets_assettypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `assets_assetdefinitions_id` int(10) unsigned NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `assets_assetdefinitions_id` (`assets_assetdefinitions_id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_assets_assettypes` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_assets_assettypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_assets_customfielddefinitions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_assets_customfielddefinitions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `assets_assetdefinitions_id` int(10) unsigned NOT NULL,
  `system_name` varchar(255) NOT NULL,
  `label` varchar(255) NOT NULL,
  `type` varchar(255) NOT NULL,
  `field_options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`field_options`)),
  `itemtype` varchar(255) DEFAULT NULL,
  `default_value` text DEFAULT NULL,
  `translations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`translations`)),
  `date_creation` timestamp NULL DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`assets_assetdefinitions_id`,`system_name`),
  KEY `system_name` (`system_name`),
  KEY `label` (`label`),
  KEY `date_creation` (`date_creation`),
  KEY `date_mod` (`date_mod`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_assets_customfielddefinitions` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_assets_customfielddefinitions` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_authldapreplicates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_authldapreplicates` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `authldaps_id` int(10) unsigned NOT NULL DEFAULT 0,
  `host` varchar(255) DEFAULT NULL,
  `port` int(11) NOT NULL DEFAULT 389,
  `name` varchar(255) DEFAULT NULL,
  `timeout` int(11) NOT NULL DEFAULT 10,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `authldaps_id` (`authldaps_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_authldapreplicates` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_authldapreplicates` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_authldaps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_authldaps` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `host` varchar(255) DEFAULT NULL,
  `basedn` varchar(255) DEFAULT NULL,
  `rootdn` varchar(255) DEFAULT NULL,
  `port` int(11) NOT NULL DEFAULT 389,
  `condition` text DEFAULT NULL,
  `login_field` varchar(255) DEFAULT 'uid',
  `sync_field` varchar(255) DEFAULT NULL,
  `use_tls` tinyint(4) NOT NULL DEFAULT 0,
  `group_field` varchar(255) DEFAULT NULL,
  `group_condition` text DEFAULT NULL,
  `group_search_type` int(11) NOT NULL DEFAULT 0,
  `group_member_field` varchar(255) DEFAULT NULL,
  `email1_field` varchar(255) DEFAULT NULL,
  `realname_field` varchar(255) DEFAULT NULL,
  `firstname_field` varchar(255) DEFAULT NULL,
  `phone_field` varchar(255) DEFAULT NULL,
  `phone2_field` varchar(255) DEFAULT NULL,
  `mobile_field` varchar(255) DEFAULT NULL,
  `comment_field` varchar(255) DEFAULT NULL,
  `use_dn` tinyint(4) NOT NULL DEFAULT 1,
  `time_offset` int(11) NOT NULL DEFAULT 0,
  `deref_option` int(11) NOT NULL DEFAULT 0,
  `title_field` varchar(255) DEFAULT NULL,
  `category_field` varchar(255) DEFAULT NULL,
  `language_field` varchar(255) DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `is_default` tinyint(4) NOT NULL DEFAULT 0,
  `is_active` tinyint(4) NOT NULL DEFAULT 0,
  `rootdn_passwd` varchar(255) DEFAULT NULL,
  `registration_number_field` varchar(255) DEFAULT NULL,
  `email2_field` varchar(255) DEFAULT NULL,
  `email3_field` varchar(255) DEFAULT NULL,
  `email4_field` varchar(255) DEFAULT NULL,
  `location_field` varchar(255) DEFAULT NULL,
  `responsible_field` varchar(255) DEFAULT NULL,
  `pagesize` int(11) NOT NULL DEFAULT 0,
  `ldap_maxlimit` int(11) NOT NULL DEFAULT 0,
  `can_support_pagesize` tinyint(4) NOT NULL DEFAULT 0,
  `picture_field` varchar(255) DEFAULT NULL,
  `begin_date_field` varchar(255) DEFAULT NULL,
  `end_date_field` varchar(255) DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `inventory_domain` varchar(255) DEFAULT NULL,
  `tls_certfile` text DEFAULT NULL,
  `tls_keyfile` text DEFAULT NULL,
  `use_bind` tinyint(4) NOT NULL DEFAULT 1,
  `timeout` int(11) NOT NULL DEFAULT 10,
  `tls_version` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `is_default` (`is_default`),
  KEY `is_active` (`is_active`),
  KEY `date_creation` (`date_creation`),
  KEY `sync_field` (`sync_field`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_authldaps` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_authldaps` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_authmails`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_authmails` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `connect_string` varchar(255) DEFAULT NULL,
  `host` varchar(255) DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT 0,
  `is_default` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_authmails` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_authmails` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_autoupdatesystems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_autoupdatesystems` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_autoupdatesystems` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_autoupdatesystems` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_blacklistedmailcontents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_blacklistedmailcontents` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `content` text DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_blacklistedmailcontents` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_blacklistedmailcontents` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_blacklists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_blacklists` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `type` int(11) NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `value` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `type` (`type`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB AUTO_INCREMENT=73 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_blacklists` DISABLE KEYS */;
INSERT INTO `glpi_blacklists` VALUES
(1,3,'invalid serial','N/A',NULL,NULL,NULL),
(2,3,'invalid serial','(null string)',NULL,NULL,NULL),
(3,3,'invalid serial','INVALID',NULL,NULL,NULL),
(4,3,'invalid serial','SYS-1234567890',NULL,NULL,NULL),
(5,3,'invalid serial','SYS-9876543210',NULL,NULL,NULL),
(6,3,'invalid serial','SN-12345',NULL,NULL,NULL),
(7,3,'invalid serial','SN-1234567890',NULL,NULL,NULL),
(8,3,'invalid serial','/^0+$/',NULL,NULL,NULL),
(9,3,'invalid serial','/^1+$/',NULL,NULL,NULL),
(10,3,'invalid serial','/\\d\\.\\d(\\.\\d)?/',NULL,NULL,NULL),
(11,3,'invalid serial','/^(0|1)+$/',NULL,NULL,NULL),
(12,3,'invalid serial','0123456789',NULL,NULL,NULL),
(13,3,'invalid serial','12345',NULL,NULL,NULL),
(14,3,'invalid serial','123456',NULL,NULL,NULL),
(15,3,'invalid serial','1234567',NULL,NULL,NULL),
(16,3,'invalid serial','12345678',NULL,NULL,NULL),
(17,3,'invalid serial','123456789',NULL,NULL,NULL),
(18,3,'invalid serial','1234567890',NULL,NULL,NULL),
(19,3,'invalid serial','123456789000',NULL,NULL,NULL),
(20,3,'invalid serial','12345678901234567',NULL,NULL,NULL),
(21,3,'invalid serial','NNNNNNN',NULL,NULL,NULL),
(22,3,'invalid serial','xxxxxxxxxxx',NULL,NULL,NULL),
(23,3,'invalid serial','EVAL',NULL,NULL,NULL),
(24,3,'invalid serial','IATPASS',NULL,NULL,NULL),
(25,3,'invalid serial','none',NULL,NULL,NULL),
(26,3,'invalid serial','To Be Filled By O.E.M.',NULL,NULL,NULL),
(27,3,'invalid serial','Tulip Computers',NULL,NULL,NULL),
(28,3,'invalid serial','Serial Number xxxxxx',NULL,NULL,NULL),
(29,3,'invalid serial','SN-123456fvgv3i0b8o5n6n7k',NULL,NULL,NULL),
(30,3,'invalid serial','Unknow',NULL,NULL,NULL),
(31,3,'invalid serial','System Serial Number',NULL,NULL,NULL),
(32,3,'invalid serial','MB-1234567890',NULL,NULL,NULL),
(33,3,'invalid serial','empty',NULL,NULL,NULL),
(34,3,'invalid serial','Not Specified',NULL,NULL,NULL),
(35,3,'invalid serial','OEM_Serial',NULL,NULL,NULL),
(36,3,'invalid serial','SystemSerialNumb',NULL,NULL,NULL),
(37,4,'invalid UUID','FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF',NULL,NULL,NULL),
(38,4,'invalid UUID','03000200-0400-0500-0006-000700080009',NULL,NULL,NULL),
(39,4,'invalid UUID','6AB5B300-538D-1014-9FB5-B0684D007B53',NULL,NULL,NULL),
(40,4,'invalid UUID','01010101-0101-0101-0101-010101010101',NULL,NULL,NULL),
(41,4,'invalid UUID','2',NULL,NULL,NULL),
(42,2,'empty MAC','',NULL,NULL,NULL),
(43,2,'invalid MAC','20:41:53:59:4e:ff',NULL,NULL,NULL),
(44,2,'invalid MAC','02:00:4e:43:50:49',NULL,NULL,NULL),
(45,2,'invalid MAC','e2:e6:16:20:0a:35',NULL,NULL,NULL),
(46,2,'invalid MAC','d2:0a:2d:a0:04:be',NULL,NULL,NULL),
(47,2,'invalid MAC','00:a0:c6:00:00:00',NULL,NULL,NULL),
(48,2,'invalid MAC','d2:6b:25:2f:2c:e7',NULL,NULL,NULL),
(49,2,'invalid MAC','33:50:6f:45:30:30',NULL,NULL,NULL),
(50,2,'invalid MAC','0a:00:27:00:00:00',NULL,NULL,NULL),
(51,2,'invalid MAC','00:50:56:C0:00:01',NULL,NULL,NULL),
(52,2,'invalid MAC','00:50:56:C0:00:08',NULL,NULL,NULL),
(53,2,'invalid MAC','02:80:37:EC:02:00',NULL,NULL,NULL),
(54,2,'invalid MAC','50:50:54:50:30:30',NULL,NULL,NULL),
(55,2,'invalid MAC','24:b6:20:52:41:53',NULL,NULL,NULL),
(56,2,'invalid MAC','00:50:56:C0:00:02',NULL,NULL,NULL),
(57,2,'invalid MAC','/00:50:56:C0:[0-9a-f]+:[0-9a-f]+/i',NULL,NULL,NULL),
(58,2,'invalid MAC','FE:FF:FF:FF:FF:FF',NULL,NULL,NULL),
(59,2,'invalid MAC','00:00:00:00:00:00',NULL,NULL,NULL),
(60,2,'invalid MAC','00:0b:ca:fe:00:00',NULL,NULL,NULL),
(61,6,'Unknow','Unknow',NULL,NULL,NULL),
(62,6,'To Be Filled By O.E.M.','To Be Filled By O.E.M.',NULL,NULL,NULL),
(63,6,'*','*',NULL,NULL,NULL),
(64,6,'System Product Name','System Product Name',NULL,NULL,NULL),
(65,6,'Product Name','Product Name',NULL,NULL,NULL),
(66,6,'System Name','System Name',NULL,NULL,NULL),
(67,6,'All Series','All Series',NULL,NULL,NULL),
(68,8,'System manufacturer','System manufacturer',NULL,NULL,NULL),
(69,1,'empty IP','',NULL,NULL,NULL),
(70,1,'zero IP','0.0.0.0',NULL,NULL,NULL),
(71,1,'localhost','127.0.0.1',NULL,NULL,NULL),
(72,1,'IPV6 localhost','::1',NULL,NULL,NULL);
/*!40000 ALTER TABLE `glpi_blacklists` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_budgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_budgets` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `begin_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `value` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `is_template` tinyint(4) NOT NULL DEFAULT 0,
  `template_name` varchar(255) DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `budgettypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `is_recursive` (`is_recursive`),
  KEY `entities_id` (`entities_id`),
  KEY `begin_date` (`begin_date`),
  KEY `end_date` (`end_date`),
  KEY `is_template` (`is_template`),
  KEY `active_assets` (`is_deleted`,`is_template`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `locations_id` (`locations_id`),
  KEY `budgettypes_id` (`budgettypes_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_budgets` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_budgets` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_budgettypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_budgettypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_budgettypes` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_budgettypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_businesscriticities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_businesscriticities` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `businesscriticities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `completename` text DEFAULT NULL,
  `level` int(11) NOT NULL DEFAULT 0,
  `ancestors_cache` longtext DEFAULT NULL,
  `sons_cache` longtext DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`businesscriticities_id`,`name`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `level` (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_businesscriticities` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_businesscriticities` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_cables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_cables` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `is_template` tinyint(4) NOT NULL DEFAULT 0,
  `template_name` varchar(255) DEFAULT NULL,
  `itemtype_endpoint_a` varchar(255) DEFAULT NULL,
  `itemtype_endpoint_b` varchar(255) DEFAULT NULL,
  `items_id_endpoint_a` int(10) unsigned NOT NULL DEFAULT 0,
  `items_id_endpoint_b` int(10) unsigned NOT NULL DEFAULT 0,
  `socketmodels_id_endpoint_a` int(10) unsigned NOT NULL DEFAULT 0,
  `socketmodels_id_endpoint_b` int(10) unsigned NOT NULL DEFAULT 0,
  `sockets_id_endpoint_a` int(10) unsigned NOT NULL DEFAULT 0,
  `sockets_id_endpoint_b` int(10) unsigned NOT NULL DEFAULT 0,
  `cablestrands_id` int(10) unsigned NOT NULL DEFAULT 0,
  `color` varchar(255) DEFAULT NULL,
  `otherserial` varchar(255) DEFAULT NULL,
  `states_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id_tech` int(10) unsigned NOT NULL DEFAULT 0,
  `cabletypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `item_endpoint_a` (`itemtype_endpoint_a`,`items_id_endpoint_a`),
  KEY `item_endpoint_b` (`itemtype_endpoint_b`,`items_id_endpoint_b`),
  KEY `items_id_endpoint_b` (`items_id_endpoint_b`),
  KEY `items_id_endpoint_a` (`items_id_endpoint_a`),
  KEY `socketmodels_id_endpoint_a` (`socketmodels_id_endpoint_a`),
  KEY `socketmodels_id_endpoint_b` (`socketmodels_id_endpoint_b`),
  KEY `sockets_id_endpoint_a` (`sockets_id_endpoint_a`),
  KEY `sockets_id_endpoint_b` (`sockets_id_endpoint_b`),
  KEY `cablestrands_id` (`cablestrands_id`),
  KEY `states_id` (`states_id`),
  KEY `complete` (`entities_id`,`name`),
  KEY `is_recursive` (`is_recursive`),
  KEY `is_template` (`is_template`),
  KEY `users_id` (`users_id`),
  KEY `users_id_tech` (`users_id_tech`),
  KEY `cabletypes_id` (`cabletypes_id`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `active_assets` (`is_deleted`,`is_template`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_cables` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_cables` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_cablestrands`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_cablestrands` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_cablestrands` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_cablestrands` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_cabletypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_cabletypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_cabletypes` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_cabletypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_calendars`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_calendars` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `cache_duration` text DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_calendars` DISABLE KEYS */;
INSERT INTO `glpi_calendars` VALUES
(1,'Default',0,1,'Default calendar',NULL,'[0,43200,43200,43200,43200,43200,0]',NULL);
/*!40000 ALTER TABLE `glpi_calendars` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_calendars_holidays`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_calendars_holidays` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `calendars_id` int(10) unsigned NOT NULL DEFAULT 0,
  `holidays_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`calendars_id`,`holidays_id`),
  KEY `holidays_id` (`holidays_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_calendars_holidays` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_calendars_holidays` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_calendarsegments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_calendarsegments` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `calendars_id` int(10) unsigned NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `day` tinyint(4) NOT NULL DEFAULT 1,
  `begin` time DEFAULT NULL,
  `end` time DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `calendars_id` (`calendars_id`),
  KEY `day` (`day`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_calendarsegments` DISABLE KEYS */;
INSERT INTO `glpi_calendarsegments` VALUES
(1,1,0,0,1,'08:00:00','20:00:00'),
(2,1,0,0,2,'08:00:00','20:00:00'),
(3,1,0,0,3,'08:00:00','20:00:00'),
(4,1,0,0,4,'08:00:00','20:00:00'),
(5,1,0,0,5,'08:00:00','20:00:00');
/*!40000 ALTER TABLE `glpi_calendarsegments` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_cartridgeitems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_cartridgeitems` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `ref` varchar(255) DEFAULT NULL,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `cartridgeitemtypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `manufacturers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id_tech` int(10) unsigned NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `alarm_threshold` int(11) NOT NULL DEFAULT 10,
  `stock_target` int(11) NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `pictures` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `manufacturers_id` (`manufacturers_id`),
  KEY `locations_id` (`locations_id`),
  KEY `users_id` (`users_id`),
  KEY `users_id_tech` (`users_id_tech`),
  KEY `cartridgeitemtypes_id` (`cartridgeitemtypes_id`),
  KEY `is_deleted` (`is_deleted`),
  KEY `alarm_threshold` (`alarm_threshold`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_cartridgeitems` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_cartridgeitems` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_cartridgeitems_printermodels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_cartridgeitems_printermodels` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `cartridgeitems_id` int(10) unsigned NOT NULL DEFAULT 0,
  `printermodels_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`printermodels_id`,`cartridgeitems_id`),
  KEY `cartridgeitems_id` (`cartridgeitems_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_cartridgeitems_printermodels` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_cartridgeitems_printermodels` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_cartridgeitemtypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_cartridgeitemtypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_cartridgeitemtypes` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_cartridgeitemtypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_cartridges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_cartridges` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `cartridgeitems_id` int(10) unsigned NOT NULL DEFAULT 0,
  `printers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date_in` date DEFAULT NULL,
  `date_use` date DEFAULT NULL,
  `date_out` date DEFAULT NULL,
  `pages` int(11) NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cartridgeitems_id` (`cartridgeitems_id`),
  KEY `printers_id` (`printers_id`),
  KEY `entities_id` (`entities_id`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_cartridges` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_cartridges` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_certificates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_certificates` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `serial` varchar(255) DEFAULT NULL,
  `otherserial` varchar(255) DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_template` tinyint(4) NOT NULL DEFAULT 0,
  `template_name` varchar(255) DEFAULT NULL,
  `certificatetypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `dns_name` varchar(255) DEFAULT NULL,
  `dns_suffix` varchar(255) DEFAULT NULL,
  `users_id_tech` int(10) unsigned NOT NULL DEFAULT 0,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `manufacturers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `contact` varchar(255) DEFAULT NULL,
  `contact_num` varchar(255) DEFAULT NULL,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_autosign` tinyint(4) NOT NULL DEFAULT 0,
  `date_expiration` date DEFAULT NULL,
  `states_id` int(10) unsigned NOT NULL DEFAULT 0,
  `command` text DEFAULT NULL,
  `certificate_request` text DEFAULT NULL,
  `certificate_item` text DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `is_template` (`is_template`),
  KEY `active_assets` (`is_deleted`,`is_template`),
  KEY `certificatetypes_id` (`certificatetypes_id`),
  KEY `users_id_tech` (`users_id_tech`),
  KEY `users_id` (`users_id`),
  KEY `locations_id` (`locations_id`),
  KEY `manufacturers_id` (`manufacturers_id`),
  KEY `states_id` (`states_id`),
  KEY `date_creation` (`date_creation`),
  KEY `date_mod` (`date_mod`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_certificates` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_certificates` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_certificates_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_certificates_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `certificates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(100) NOT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`certificates_id`,`itemtype`,`items_id`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `date_creation` (`date_creation`),
  KEY `date_mod` (`date_mod`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_certificates_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_certificates_items` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_certificatetypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_certificatetypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `name` (`name`),
  KEY `date_creation` (`date_creation`),
  KEY `date_mod` (`date_mod`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_certificatetypes` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_certificatetypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_changecosts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_changecosts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `changes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `begin_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `actiontime` int(11) NOT NULL DEFAULT 0,
  `cost_time` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `cost_fixed` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `cost_material` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `budgets_id` int(10) unsigned NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `changes_id` (`changes_id`),
  KEY `begin_date` (`begin_date`),
  KEY `end_date` (`end_date`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `budgets_id` (`budgets_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_changecosts` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_changecosts` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_changes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_changes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `status` int(11) NOT NULL DEFAULT 1,
  `content` longtext DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date` timestamp NULL DEFAULT NULL,
  `solvedate` timestamp NULL DEFAULT NULL,
  `closedate` timestamp NULL DEFAULT NULL,
  `time_to_resolve` timestamp NULL DEFAULT NULL,
  `users_id_recipient` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id_lastupdater` int(10) unsigned NOT NULL DEFAULT 0,
  `urgency` int(11) NOT NULL DEFAULT 1,
  `impact` int(11) NOT NULL DEFAULT 1,
  `priority` int(11) NOT NULL DEFAULT 1,
  `itilcategories_id` int(10) unsigned NOT NULL DEFAULT 0,
  `impactcontent` longtext DEFAULT NULL,
  `controlistcontent` longtext DEFAULT NULL,
  `rolloutplancontent` longtext DEFAULT NULL,
  `backoutplancontent` longtext DEFAULT NULL,
  `checklistcontent` longtext DEFAULT NULL,
  `global_validation` int(11) NOT NULL DEFAULT 1,
  `actiontime` int(11) NOT NULL DEFAULT 0,
  `begin_waiting_date` timestamp NULL DEFAULT NULL,
  `waiting_duration` int(11) NOT NULL DEFAULT 0,
  `close_delay_stat` int(11) NOT NULL DEFAULT 0,
  `solve_delay_stat` int(11) NOT NULL DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT NULL,
  `changetemplates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `is_deleted` (`is_deleted`),
  KEY `date` (`date`),
  KEY `closedate` (`closedate`),
  KEY `status` (`status`),
  KEY `priority` (`priority`),
  KEY `date_mod` (`date_mod`),
  KEY `itilcategories_id` (`itilcategories_id`),
  KEY `users_id_recipient` (`users_id_recipient`),
  KEY `solvedate` (`solvedate`),
  KEY `urgency` (`urgency`),
  KEY `impact` (`impact`),
  KEY `time_to_resolve` (`time_to_resolve`),
  KEY `global_validation` (`global_validation`),
  KEY `users_id_lastupdater` (`users_id_lastupdater`),
  KEY `date_creation` (`date_creation`),
  KEY `changetemplates_id` (`changetemplates_id`),
  KEY `locations_id` (`locations_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_changes` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_changes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_changes_changes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_changes_changes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `changes_id_1` int(10) unsigned NOT NULL DEFAULT 0,
  `changes_id_2` int(10) unsigned NOT NULL DEFAULT 0,
  `link` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`changes_id_1`,`changes_id_2`),
  KEY `changes_id_2` (`changes_id_2`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_changes_changes` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_changes_changes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_changes_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_changes_groups` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `changes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `groups_id` int(10) unsigned NOT NULL DEFAULT 0,
  `type` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`changes_id`,`type`,`groups_id`),
  KEY `group` (`groups_id`,`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_changes_groups` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_changes_groups` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_changes_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_changes_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `changes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(100) DEFAULT NULL,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`changes_id`,`itemtype`,`items_id`),
  KEY `item` (`itemtype`,`items_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_changes_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_changes_items` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_changes_problems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_changes_problems` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `changes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `problems_id` int(10) unsigned NOT NULL DEFAULT 0,
  `link` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`changes_id`,`problems_id`),
  KEY `problems_id` (`problems_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_changes_problems` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_changes_problems` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_changes_suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_changes_suppliers` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `changes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `suppliers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `type` int(11) NOT NULL DEFAULT 1,
  `use_notification` tinyint(4) NOT NULL DEFAULT 0,
  `alternative_email` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`changes_id`,`type`,`suppliers_id`),
  KEY `group` (`suppliers_id`,`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_changes_suppliers` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_changes_suppliers` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_changes_tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_changes_tickets` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `changes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `tickets_id` int(10) unsigned NOT NULL DEFAULT 0,
  `link` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`changes_id`,`tickets_id`),
  KEY `tickets_id` (`tickets_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_changes_tickets` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_changes_tickets` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_changes_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_changes_users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `changes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `type` int(11) NOT NULL DEFAULT 1,
  `use_notification` tinyint(4) NOT NULL DEFAULT 0,
  `alternative_email` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`changes_id`,`type`,`users_id`,`alternative_email`),
  KEY `user` (`users_id`,`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_changes_users` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_changes_users` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_changesatisfactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_changesatisfactions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `changes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `type` int(11) NOT NULL DEFAULT 1,
  `date_begin` timestamp NULL DEFAULT NULL,
  `date_answered` timestamp NULL DEFAULT NULL,
  `satisfaction` int(11) DEFAULT NULL,
  `satisfaction_scaled_to_5` float DEFAULT NULL,
  `comment` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `changes_id` (`changes_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_changesatisfactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_changesatisfactions` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_changetasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_changetasks` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) DEFAULT NULL,
  `changes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `taskcategories_id` int(10) unsigned NOT NULL DEFAULT 0,
  `state` int(11) NOT NULL DEFAULT 0,
  `date` timestamp NULL DEFAULT NULL,
  `begin` timestamp NULL DEFAULT NULL,
  `end` timestamp NULL DEFAULT NULL,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id_editor` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id_tech` int(10) unsigned NOT NULL DEFAULT 0,
  `groups_id_tech` int(10) unsigned NOT NULL DEFAULT 0,
  `content` longtext DEFAULT NULL,
  `actiontime` int(11) NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `tasktemplates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `timeline_position` tinyint(4) NOT NULL DEFAULT 0,
  `is_private` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `changes_id` (`changes_id`),
  KEY `state` (`state`),
  KEY `users_id` (`users_id`),
  KEY `users_id_editor` (`users_id_editor`),
  KEY `users_id_tech` (`users_id_tech`),
  KEY `groups_id_tech` (`groups_id_tech`),
  KEY `date` (`date`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `begin` (`begin`),
  KEY `end` (`end`),
  KEY `taskcategories_id` (`taskcategories_id`),
  KEY `tasktemplates_id` (`tasktemplates_id`),
  KEY `is_private` (`is_private`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_changetasks` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_changetasks` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_changetemplatehiddenfields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_changetemplatehiddenfields` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `changetemplates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `num` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`changetemplates_id`,`num`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_changetemplatehiddenfields` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_changetemplatehiddenfields` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_changetemplatemandatoryfields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_changetemplatemandatoryfields` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `changetemplates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `num` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`changetemplates_id`,`num`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_changetemplatemandatoryfields` DISABLE KEYS */;
INSERT INTO `glpi_changetemplatemandatoryfields` VALUES
(1,1,21);
/*!40000 ALTER TABLE `glpi_changetemplatemandatoryfields` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_changetemplatepredefinedfields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_changetemplatepredefinedfields` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `changetemplates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `num` int(11) NOT NULL DEFAULT 0,
  `value` longtext DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `changetemplates_id` (`changetemplates_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_changetemplatepredefinedfields` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_changetemplatepredefinedfields` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_changetemplatereadonlyfields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_changetemplatereadonlyfields` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `changetemplates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `num` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`changetemplates_id`,`num`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_changetemplatereadonlyfields` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_changetemplatereadonlyfields` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_changetemplates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_changetemplates` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `allowed_statuses` varchar(255) NOT NULL DEFAULT '[1,9,10,7,4,11,12,5,8,6,14,13]',
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_changetemplates` DISABLE KEYS */;
INSERT INTO `glpi_changetemplates` VALUES
(1,'Default',0,1,NULL,'[1,9,10,7,4,11,12,5,8,6,14,13]');
/*!40000 ALTER TABLE `glpi_changetemplates` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_changevalidations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_changevalidations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `itils_validationsteps_id` int(10) unsigned NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `changes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id_validate` int(10) unsigned NOT NULL DEFAULT 0,
  `itilvalidationtemplates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype_target` varchar(255) NOT NULL,
  `items_id_target` int(10) unsigned NOT NULL DEFAULT 0,
  `comment_submission` text DEFAULT NULL,
  `comment_validation` text DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 2,
  `submission_date` timestamp NULL DEFAULT NULL,
  `validation_date` timestamp NULL DEFAULT NULL,
  `timeline_position` tinyint(4) NOT NULL DEFAULT 0,
  `last_reminder_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `users_id` (`users_id`),
  KEY `users_id_validate` (`users_id_validate`),
  KEY `itilvalidationtemplates_id` (`itilvalidationtemplates_id`),
  KEY `item_target` (`itemtype_target`,`items_id_target`),
  KEY `changes_id` (`changes_id`),
  KEY `submission_date` (`submission_date`),
  KEY `validation_date` (`validation_date`),
  KEY `status` (`status`),
  KEY `itils_validationsteps_id` (`itils_validationsteps_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_changevalidations` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_changevalidations` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_clusters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_clusters` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `uuid` varchar(255) DEFAULT NULL,
  `version` varchar(255) DEFAULT NULL,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id_tech` int(10) unsigned NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `states_id` int(10) unsigned NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `clustertypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `autoupdatesystems_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `users_id` (`users_id`),
  KEY `users_id_tech` (`users_id_tech`),
  KEY `is_deleted` (`is_deleted`),
  KEY `states_id` (`states_id`),
  KEY `clustertypes_id` (`clustertypes_id`),
  KEY `autoupdatesystems_id` (`autoupdatesystems_id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `date_creation` (`date_creation`),
  KEY `date_mod` (`date_mod`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_clusters` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_clusters` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_clustertypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_clustertypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `date_creation` (`date_creation`),
  KEY `date_mod` (`date_mod`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_clustertypes` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_clustertypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_computermodels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_computermodels` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `product_number` varchar(255) DEFAULT NULL,
  `weight` int(11) NOT NULL DEFAULT 0,
  `required_units` int(11) NOT NULL DEFAULT 1,
  `depth` float NOT NULL DEFAULT 1,
  `power_connections` int(11) NOT NULL DEFAULT 0,
  `power_consumption` int(11) NOT NULL DEFAULT 0,
  `is_half_rack` tinyint(4) NOT NULL DEFAULT 0,
  `picture_front` text DEFAULT NULL,
  `picture_rear` text DEFAULT NULL,
  `pictures` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `product_number` (`product_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_computermodels` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_computermodels` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_computers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_computers` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `serial` varchar(255) DEFAULT NULL,
  `otherserial` varchar(255) DEFAULT NULL,
  `contact` varchar(255) DEFAULT NULL,
  `contact_num` varchar(255) DEFAULT NULL,
  `users_id_tech` int(10) unsigned NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `autoupdatesystems_id` int(10) unsigned NOT NULL DEFAULT 0,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `networks_id` int(10) unsigned NOT NULL DEFAULT 0,
  `computermodels_id` int(10) unsigned NOT NULL DEFAULT 0,
  `computertypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_template` tinyint(4) NOT NULL DEFAULT 0,
  `template_name` varchar(255) DEFAULT NULL,
  `manufacturers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `states_id` int(10) unsigned NOT NULL DEFAULT 0,
  `ticket_tco` decimal(20,4) DEFAULT 0.0000,
  `uuid` varchar(255) DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `last_inventory_update` timestamp NULL DEFAULT NULL,
  `last_boot` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `date_mod` (`date_mod`),
  KEY `name` (`name`),
  KEY `is_template` (`is_template`),
  KEY `autoupdatesystems_id` (`autoupdatesystems_id`),
  KEY `entities_id` (`entities_id`),
  KEY `manufacturers_id` (`manufacturers_id`),
  KEY `users_id` (`users_id`),
  KEY `locations_id` (`locations_id`),
  KEY `computermodels_id` (`computermodels_id`),
  KEY `networks_id` (`networks_id`),
  KEY `states_id` (`states_id`),
  KEY `users_id_tech` (`users_id_tech`),
  KEY `computertypes_id` (`computertypes_id`),
  KEY `active_assets` (`is_deleted`,`is_template`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `serial` (`serial`),
  KEY `otherserial` (`otherserial`),
  KEY `uuid` (`uuid`),
  KEY `date_creation` (`date_creation`),
  KEY `is_recursive` (`is_recursive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_computers` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_computers` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_computertypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_computertypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_computertypes` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_computertypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_configs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_configs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `context` varchar(150) DEFAULT NULL,
  `name` varchar(150) DEFAULT NULL,
  `value` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`context`,`name`),
  KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=298 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_configs` DISABLE KEYS */;
INSERT INTO `glpi_configs` VALUES
(1,'core','version','11.0.11'),
(2,'core','show_jobs_at_login','0'),
(3,'core','cut','250'),
(4,'core','list_limit','15'),
(5,'core','list_limit_max','50'),
(6,'core','url_maxlength','30'),
(7,'core','event_loglevel','5'),
(8,'core','notifications_mailing','0'),
(9,'core','admin_email','admsys@localhost'),
(10,'core','admin_email_name',''),
(11,'core','admin_email_noreply',''),
(12,'core','admin_email_noreply_name',''),
(13,'core','admin_reply',''),
(14,'core','admin_reply_name',''),
(15,'core','from_email',''),
(16,'core','from_email_name',''),
(17,'core','noreply_email',''),
(18,'core','noreply_email_name',''),
(19,'core','replyto_email',''),
(20,'core','replyto_email_name',''),
(21,'core','mailing_signature','SIGNATURE'),
(22,'core','use_anonymous_helpdesk','0'),
(23,'core','use_anonymous_followups','0'),
(24,'core','language','es_ES'),
(25,'core','priority_1','#fff2f2'),
(26,'core','priority_2','#ffe0e0'),
(27,'core','priority_3','#ffcece'),
(28,'core','priority_4','#ffbfbf'),
(29,'core','priority_5','#ffadad'),
(30,'core','priority_6','#ff5555'),
(31,'core','date_tax','2005-12-31'),
(32,'core','cas_host',''),
(33,'core','cas_port','443'),
(34,'core','cas_uri',''),
(35,'core','cas_logout',''),
(36,'core','cas_version','CAS_VERSION_2_0'),
(37,'core','existing_auth_server_field_clean_domain','0'),
(38,'core','planning_begin','08:00:00'),
(39,'core','planning_end','20:00:00'),
(40,'core','utf8_conv','1'),
(41,'core','use_public_faq','0'),
(42,'core','allow_unauthenticated_uploads','0'),
(43,'core','url_base','http://localhost:8081'),
(44,'core','show_link_in_mail','0'),
(45,'core','text_login',''),
(46,'core','found_new_version',''),
(47,'core','dropdown_max','100'),
(48,'core','ajax_wildcard','*'),
(49,'core','ajax_limit_count','10'),
(50,'core','is_users_auto_add','1'),
(51,'core','date_format','0'),
(52,'core','number_format','0'),
(53,'core','csv_delimiter',';'),
(54,'core','is_ids_visible','0'),
(55,'core','smtp_mode','0'),
(56,'core','smtp_host',''),
(57,'core','smtp_port','25'),
(58,'core','smtp_username',''),
(59,'core','smtp_oauth_provider',''),
(60,'core','smtp_oauth_client_id',''),
(61,'core','smtp_oauth_client_secret',''),
(62,'core','smtp_oauth_options','{}'),
(63,'core','smtp_oauth_refresh_token',''),
(64,'core','proxy_name',''),
(65,'core','proxy_port','8080'),
(66,'core','proxy_user',''),
(67,'core','proxy_exclusions',''),
(68,'core','add_followup_on_update_ticket','1'),
(69,'core','keep_tickets_on_delete','0'),
(70,'core','time_step','5'),
(71,'core','decimal_number','2'),
(72,'core','helpdesk_doc_url',''),
(73,'core','central_doc_url',''),
(74,'core','documentcategories_id_forticket','0'),
(75,'core','monitors_management_restrict','2'),
(76,'core','phones_management_restrict','2'),
(77,'core','peripherals_management_restrict','2'),
(78,'core','printers_management_restrict','2'),
(79,'core','use_log_in_files','1'),
(80,'core','time_offset','0'),
(81,'core','use_flat_dropdowntree','0'),
(82,'core','use_flat_dropdowntree_on_search_result','1'),
(83,'core','use_autoname_by_entity','1'),
(84,'core','softwarecategories_id_ondelete','1'),
(85,'core','x509_email_field',''),
(86,'core','x509_cn_restrict',''),
(87,'core','x509_o_restrict',''),
(88,'core','x509_ou_restrict',''),
(89,'core','default_mailcollector_filesize_max','2097152'),
(90,'core','followup_private','0'),
(91,'core','task_private','0'),
(92,'core','default_software_helpdesk_visible','1'),
(93,'core','names_format','0'),
(94,'core','default_requesttypes_id','1'),
(95,'core','use_noright_users_add','1'),
(96,'core','cron_limit','5'),
(97,'core','priority_matrix','{\"1\":{\"1\":1,\"2\":1,\"3\":2,\"4\":2,\"5\":2},\"2\":{\"1\":1,\"2\":2,\"3\":2,\"4\":3,\"5\":3},\"3\":{\"1\":2,\"2\":2,\"3\":3,\"4\":4,\"5\":4},\"4\":{\"1\":2,\"2\":3,\"3\":4,\"4\":4,\"5\":5},\"5\":{\"1\":2,\"2\":3,\"3\":4,\"4\":5,\"5\":5}}'),
(98,'core','urgency_mask','62'),
(99,'core','impact_mask','62'),
(100,'core','user_deleted_ldap_user','0'),
(101,'core','user_deleted_ldap_groups','0'),
(102,'core','user_deleted_ldap_authorizations','0'),
(103,'core','user_restored_ldap','0'),
(104,'core','auto_create_infocoms','0'),
(105,'core','use_slave_for_search','0'),
(106,'core','proxy_passwd',''),
(107,'core','smtp_passwd',''),
(108,'core','show_count_on_tabs','1'),
(109,'core','refresh_views','0'),
(110,'core','set_default_tech','1'),
(111,'core','set_followup_tech','0'),
(112,'core','set_solution_tech','0'),
(113,'core','allow_search_view','2'),
(114,'core','allow_search_all','0'),
(115,'core','allow_search_global','1'),
(116,'core','display_count_on_home','5'),
(117,'core','use_password_security','0'),
(118,'core','password_min_length','8'),
(119,'core','password_need_number','1'),
(120,'core','password_need_letter','1'),
(121,'core','password_need_caps','1'),
(122,'core','password_need_symbol','1'),
(123,'core','use_check_pref','0'),
(124,'core','notification_to_myself','1'),
(125,'core','duedateok_color','#06ff00'),
(126,'core','duedatewarning_color','#ffb800'),
(127,'core','duedatecritical_color','#ff0000'),
(128,'core','duedatewarning_less','20'),
(129,'core','duedatecritical_less','5'),
(130,'core','duedatewarning_unit','%'),
(131,'core','duedatecritical_unit','%'),
(132,'core','realname_ssofield',''),
(133,'core','firstname_ssofield',''),
(134,'core','email1_ssofield',''),
(135,'core','email2_ssofield',''),
(136,'core','email3_ssofield',''),
(137,'core','email4_ssofield',''),
(138,'core','phone_ssofield',''),
(139,'core','phone2_ssofield',''),
(140,'core','mobile_ssofield',''),
(141,'core','comment_ssofield',''),
(142,'core','title_ssofield',''),
(143,'core','category_ssofield',''),
(144,'core','language_ssofield',''),
(145,'core','entity_ssofield',''),
(146,'core','registration_number_ssofield',''),
(147,'core','ssovariables_id','0'),
(148,'core','ssologout_url',''),
(149,'core','pdffont','dejavusans'),
(150,'core','keep_devices_when_purging_item','0'),
(151,'core','maintenance_mode','0'),
(152,'core','maintenance_text',''),
(153,'core','attach_ticket_documents_to_mail','0'),
(154,'core','backcreated','1'),
(155,'core','attach_documents_to_notifications_for_anonymous','0'),
(156,'core','task_state','1'),
(157,'core','planned_task_state','1'),
(158,'core','palette','auror'),
(159,'core','page_layout','vertical'),
(160,'core','fold_menu','0'),
(161,'core','savedsearches_pinned','0'),
(162,'core','timeline_order','natural'),
(163,'core','itil_layout',''),
(164,'core','richtext_layout','classic'),
(165,'core','lock_use_lock_item','0'),
(166,'core','lock_autolock_mode','1'),
(167,'core','lock_directunlock_notification','0'),
(168,'core','lock_item_list','[]'),
(169,'core','lock_lockprofile_id','8'),
(170,'core','set_default_requester','1'),
(171,'core','highcontrast_css','0'),
(172,'core','default_central_tab','0'),
(173,'core','smtp_check_certificate','1'),
(174,'core','enable_api','1'),
(175,'core','enable_hlapi','0'),
(176,'core','enable_api_login_credentials','0'),
(177,'core','enable_api_login_external_token','1'),
(178,'core','login_remember_time','604800'),
(179,'core','login_remember_default','1'),
(180,'core','use_notifications','0'),
(181,'core','notifications_ajax','0'),
(182,'core','notifications_ajax_check_interval','5'),
(183,'core','notifications_ajax_sound',NULL),
(184,'core','notifications_ajax_icon_url','/pics/glpi.png'),
(185,'core','notifications_ajax_expiration_delay','7'),
(186,'core','dbversion','11.0.11@7b129479687ebafebb6966eaa1d72cb683390613'),
(187,'core','smtp_max_retries','5'),
(188,'core','smtp_sender',NULL),
(189,'core','instance_uuid',NULL),
(190,'core','registration_uuid','lScHDkkZncMDMZ9unOqxUwsXQ0yoL5KhwF3OTXy3'),
(191,'core','smtp_retry_time','5'),
(192,'core','purge_all','0'),
(193,'core','purge_refusedequipment','1'),
(194,'core','purge_plugins','0'),
(195,'core','purge_user_auth_changes','12'),
(196,'core','purge_datemod','12'),
(197,'core','purge_comments','0'),
(198,'core','purge_updateitem','0'),
(199,'core','purge_restoreitem','0'),
(200,'core','purge_deleteitem','0'),
(201,'core','purge_createitem','0'),
(202,'core','purge_deleterelation','0'),
(203,'core','purge_addrelation','0'),
(204,'core','purge_userdeletedfromldap','1'),
(205,'core','purge_disconnectdevice','6'),
(206,'core','purge_connectdevice','6'),
(207,'core','purge_deletedevice','6'),
(208,'core','purge_updatedevice','6'),
(209,'core','purge_adddevice','6'),
(210,'core','purge_group_user','12'),
(211,'core','purge_profile_user','12'),
(212,'core','purge_infocom_creation','0'),
(213,'core','purge_software_version_install','3'),
(214,'core','purge_software_item_install','3'),
(215,'core','purge_item_software_install','3'),
(216,'core','display_login_source','1'),
(217,'core','devices_in_menu','[\"Item_DeviceSimcard\"]'),
(218,'core','password_expiration_delay','-1'),
(219,'core','password_expiration_notice','-1'),
(220,'core','password_expiration_lock_delay','-1'),
(221,'core','password_init_token_delay','86400'),
(222,'core','default_dashboard_central','central'),
(223,'core','default_dashboard_assets','assets'),
(224,'core','default_dashboard_helpdesk','assistance'),
(225,'core','default_dashboard_mini_ticket','mini_tickets'),
(226,'core','impact_enabled_itemtypes','[\"Appliance\",\"Cluster\",\"Computer\",\"Datacenter\",\"DCRoom\",\"Domain\",\"Enclosure\",\"Monitor\",\"NetworkEquipment\",\"PDU\",\"Peripheral\",\"Phone\",\"Printer\",\"Rack\",\"Software\",\"DatabaseInstance\"]'),
(227,'core','document_max_size','20'),
(228,'core','planning_work_days','[0,1,2,3,4,5,6]'),
(229,'core','system_user','6'),
(230,'core','support_legacy_data','0'),
(231,'core','toast_location','bottom-right'),
(232,'core','initialized_rules_collections','[\"RuleImportAssetCollection\",\"RuleMailCollectorCollection\",\"RuleRightCollection\",\"RuleSoftwareCategoryCollection\",\"RuleTicketCollection\",\"RuleAssetCollection\",\"RuleDictionnaryOperatingSystemCollection\",\"RuleDictionnaryOperatingSystemVersionCollection\",\"RuleDictionnaryOperatingSystemEditionCollection\"]'),
(233,'core','timeline_action_btn_layout','0'),
(234,'core','timeline_date_format','0'),
(235,'core','are_apiclients_tokens_encrypted','1'),
(236,'core','are_users_tokens_encrypted','1'),
(237,'core','2fa_enforced','0'),
(238,'core','2fa_grace_date_start',NULL),
(239,'core','2fa_grace_days','0'),
(240,'core','2fa_suffix',''),
(241,'core','is_notif_enable_default','1'),
(242,'core','show_search_form','0'),
(243,'core','search_pagination_on_top','0'),
(244,'core','is_demo_dashboards','1'),
(245,'core','projecttask_unstarted_states_id','0'),
(246,'core','projecttask_inprogress_states_id','0'),
(247,'core','projecttask_completed_states_id','0'),
(248,'core','non_reusable_passwords_count','1'),
(249,'core','plugins_execution_mode','on'),
(250,'core','glpinetwork_registration_key',NULL),
(251,'core','impact_assets_list','[]'),
(252,'core','timezone','0'),
(253,'core','glpi_11_form_migration','0'),
(254,'core','glpi_11_assets_migration','0'),
(255,'core','must_unsanitize_db_data','0'),
(256,'inventory','enabled_inventory','0'),
(257,'inventory','import_software','1'),
(258,'inventory','import_volume','1'),
(259,'inventory','import_antivirus','1'),
(260,'inventory','import_registry','1'),
(261,'inventory','import_process','1'),
(262,'inventory','import_vm','1'),
(263,'inventory','import_monitor_on_partial_sn','0'),
(264,'inventory','import_unmanaged','1'),
(265,'inventory','component_processor','1'),
(266,'inventory','component_memory','1'),
(267,'inventory','component_harddrive','1'),
(268,'inventory','component_networkcard','1'),
(269,'inventory','component_graphiccard','1'),
(270,'inventory','component_soundcard','1'),
(271,'inventory','component_drive','1'),
(272,'inventory','component_networkdrive','1'),
(273,'inventory','component_networkcardvirtual','1'),
(274,'inventory','component_control','1'),
(275,'inventory','component_battery','1'),
(276,'inventory','component_simcard','1'),
(277,'inventory','states_id_default','0'),
(278,'inventory','entities_id_default','0'),
(279,'inventory','location','0'),
(280,'inventory','group','0'),
(281,'inventory','vm_type','0'),
(282,'inventory','vm_components','0'),
(283,'inventory','vm_as_computer','0'),
(284,'inventory','component_removablemedia','1'),
(285,'inventory','component_powersupply','1'),
(286,'inventory','inventory_frequency','24'),
(287,'inventory','import_monitor','1'),
(288,'inventory','import_printer','1'),
(289,'inventory','import_peripheral','1'),
(290,'inventory','stale_agents_delay','0'),
(291,'inventory','stale_agents_action','[0]'),
(292,'inventory','stale_agents_status','0'),
(293,'inventory','stale_agents_status_condition','[\"all\"]'),
(294,'inventory','import_env','0'),
(295,'inventory','auth_required','none'),
(296,'inventory','basic_auth_login',''),
(297,'inventory','basic_auth_password','');
/*!40000 ALTER TABLE `glpi_configs` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_consumableitems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_consumableitems` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `ref` varchar(255) DEFAULT NULL,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `consumableitemtypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `manufacturers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id_tech` int(10) unsigned NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `alarm_threshold` int(11) NOT NULL DEFAULT 10,
  `stock_target` int(11) NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `otherserial` varchar(255) DEFAULT NULL,
  `pictures` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `manufacturers_id` (`manufacturers_id`),
  KEY `locations_id` (`locations_id`),
  KEY `users_id` (`users_id`),
  KEY `users_id_tech` (`users_id_tech`),
  KEY `consumableitemtypes_id` (`consumableitemtypes_id`),
  KEY `is_deleted` (`is_deleted`),
  KEY `alarm_threshold` (`alarm_threshold`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `otherserial` (`otherserial`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_consumableitems` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_consumableitems` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_consumableitemtypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_consumableitemtypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_consumableitemtypes` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_consumableitemtypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_consumables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_consumables` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `consumableitems_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date_in` date DEFAULT NULL,
  `date_out` date DEFAULT NULL,
  `itemtype` varchar(100) DEFAULT NULL,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `date_in` (`date_in`),
  KEY `date_out` (`date_out`),
  KEY `consumableitems_id` (`consumableitems_id`),
  KEY `entities_id` (`entities_id`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_consumables` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_consumables` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_contacts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `firstname` varchar(255) DEFAULT NULL,
  `registration_number` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `phone2` varchar(255) DEFAULT NULL,
  `mobile` varchar(255) DEFAULT NULL,
  `fax` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `contacttypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `usertitles_id` int(10) unsigned NOT NULL DEFAULT 0,
  `address` text DEFAULT NULL,
  `postcode` varchar(255) DEFAULT NULL,
  `town` varchar(255) DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `pictures` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `contacttypes_id` (`contacttypes_id`),
  KEY `is_deleted` (`is_deleted`),
  KEY `usertitles_id` (`usertitles_id`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_contacts` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_contacts` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_contacts_suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_contacts_suppliers` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `suppliers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `contacts_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`suppliers_id`,`contacts_id`),
  KEY `contacts_id` (`contacts_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_contacts_suppliers` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_contacts_suppliers` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_contacttypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_contacttypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_contacttypes` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_contacttypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_contractcosts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_contractcosts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `contracts_id` int(10) unsigned NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `begin_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `cost` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `budgets_id` int(10) unsigned NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `contracts_id` (`contracts_id`),
  KEY `begin_date` (`begin_date`),
  KEY `end_date` (`end_date`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `budgets_id` (`budgets_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_contractcosts` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_contractcosts` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_contracts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_contracts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `num` varchar(255) DEFAULT NULL,
  `contracttypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `begin_date` date DEFAULT NULL,
  `duration` int(11) NOT NULL DEFAULT 0,
  `notice` int(11) NOT NULL DEFAULT 0,
  `periodicity` int(11) NOT NULL DEFAULT 0,
  `billing` int(11) NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `accounting_number` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `week_begin_hour` time NOT NULL DEFAULT '00:00:00',
  `week_end_hour` time NOT NULL DEFAULT '00:00:00',
  `saturday_begin_hour` time NOT NULL DEFAULT '00:00:00',
  `saturday_end_hour` time NOT NULL DEFAULT '00:00:00',
  `use_saturday` tinyint(4) NOT NULL DEFAULT 0,
  `sunday_begin_hour` time NOT NULL DEFAULT '00:00:00',
  `sunday_end_hour` time NOT NULL DEFAULT '00:00:00',
  `use_sunday` tinyint(4) NOT NULL DEFAULT 0,
  `max_links_allowed` int(11) NOT NULL DEFAULT 0,
  `alert` int(11) NOT NULL DEFAULT 0,
  `renewal` int(11) NOT NULL DEFAULT 0,
  `template_name` varchar(255) DEFAULT NULL,
  `is_template` tinyint(4) NOT NULL DEFAULT 0,
  `states_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `begin_date` (`begin_date`),
  KEY `name` (`name`),
  KEY `contracttypes_id` (`contracttypes_id`),
  KEY `locations_id` (`locations_id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `is_template` (`is_template`),
  KEY `active_assets` (`is_deleted`,`is_template`),
  KEY `use_sunday` (`use_sunday`),
  KEY `use_saturday` (`use_saturday`),
  KEY `alert` (`alert`),
  KEY `states_id` (`states_id`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_contracts` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_contracts` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_contracts_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_contracts_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `contracts_id` int(10) unsigned NOT NULL DEFAULT 0,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`contracts_id`,`itemtype`,`items_id`),
  KEY `item` (`itemtype`,`items_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_contracts_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_contracts_items` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_contracts_suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_contracts_suppliers` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `suppliers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `contracts_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`suppliers_id`,`contracts_id`),
  KEY `contracts_id` (`contracts_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_contracts_suppliers` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_contracts_suppliers` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_contracts_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_contracts_users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `contracts_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`contracts_id`,`users_id`),
  KEY `item` (`users_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_contracts_users` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_contracts_users` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_contracttypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_contracttypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_contracttypes` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_contracttypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_crontasklogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_crontasklogs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `crontasks_id` int(10) unsigned NOT NULL,
  `crontasklogs_id` int(10) unsigned NOT NULL,
  `date` timestamp NOT NULL DEFAULT current_timestamp(),
  `state` int(11) NOT NULL,
  `elapsed` float NOT NULL,
  `volume` int(11) NOT NULL,
  `content` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `date` (`date`),
  KEY `crontasks_id` (`crontasks_id`),
  KEY `crontasklogs_id_state` (`crontasklogs_id`,`state`)
) ENGINE=InnoDB AUTO_INCREMENT=857 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_crontasklogs` DISABLE KEYS */;
INSERT INTO `glpi_crontasklogs` VALUES
(1,5,0,'2026-10-13 17:03:01',0,0,0,'Run mode: GLPI'),
(2,5,1,'2026-10-13 17:03:01',2,0.0126722,0,'Action completed, no processing required'),
(3,39,0,'2026-10-13 17:03:06',0,0,0,'Run mode: CLI'),
(4,39,3,'2026-10-13 17:03:06',2,0.055542,0,'Action completed, no processing required'),
(5,42,0,'2026-10-13 17:03:06',0,0,0,'Run mode: CLI'),
(6,42,5,'2026-10-13 17:03:06',2,0.310956,0,'Action completed, fully processed'),
(7,44,0,'2026-10-13 17:03:06',0,0,0,'Run mode: CLI'),
(8,44,7,'2026-10-13 17:03:06',2,0.019753,0,'Action completed, no processing required'),
(9,46,0,'2026-10-13 17:03:06',0,0,0,'Run mode: CLI'),
(10,46,9,'2026-10-13 17:03:06',2,0.0100551,0,'Action completed, no processing required'),
(11,48,0,'2026-10-13 17:03:06',0,0,0,'Run mode: CLI'),
(12,48,11,'2026-10-13 17:03:06',2,0.00934505,0,'Action completed, fully processed'),
(13,46,0,'2026-10-13 17:04:08',0,0,0,'Run mode: CLI'),
(14,46,13,'2026-10-13 17:04:08',2,0.0722311,0,'Action completed, no processing required'),
(15,46,0,'2026-10-13 17:05:08',0,0,0,'Run mode: CLI'),
(16,46,15,'2026-10-13 17:05:08',2,0.0453348,0,'Action completed, no processing required'),
(17,46,0,'2026-10-13 17:06:09',0,0,0,'Run mode: CLI'),
(18,46,17,'2026-10-13 17:06:09',2,0.0389252,0,'Action completed, no processing required'),
(19,46,0,'2026-10-13 17:07:09',0,0,0,'Run mode: CLI'),
(20,46,19,'2026-10-13 17:07:09',2,0.0233181,0,'Action completed, no processing required'),
(21,46,0,'2026-10-13 17:08:10',0,0,0,'Run mode: CLI'),
(22,46,21,'2026-10-13 17:08:10',2,0.052315,0,'Action completed, no processing required'),
(23,46,0,'2026-10-13 17:09:10',0,0,0,'Run mode: CLI'),
(24,46,23,'2026-10-13 17:09:10',2,0.023689,0,'Action completed, no processing required'),
(25,46,0,'2026-10-13 17:10:10',0,0,0,'Run mode: CLI'),
(26,46,25,'2026-10-13 17:10:10',2,0.046267,0,'Action completed, no processing required'),
(27,46,0,'2026-10-13 17:11:11',0,0,0,'Run mode: CLI'),
(28,46,27,'2026-10-13 17:11:11',2,0.021872,0,'Action completed, no processing required'),
(29,6,0,'2026-10-13 17:11:16',0,0,0,'Run mode: GLPI'),
(30,6,29,'2026-10-13 17:11:16',2,0.0124872,0,'Action completed, no processing required'),
(31,46,0,'2026-10-13 17:12:11',0,0,0,'Run mode: CLI'),
(32,46,31,'2026-10-13 17:12:11',2,0.0296309,0,'Action completed, no processing required'),
(33,46,0,'2026-10-13 17:13:11',0,0,0,'Run mode: CLI'),
(34,46,33,'2026-10-13 17:13:11',2,0.0285039,0,'Action completed, no processing required'),
(35,46,0,'2026-10-13 17:14:12',0,0,0,'Run mode: CLI'),
(36,46,35,'2026-10-13 17:14:12',2,0.035285,0,'Action completed, no processing required'),
(37,46,0,'2026-10-13 17:15:12',0,0,0,'Run mode: CLI'),
(38,46,37,'2026-10-13 17:15:12',2,0.0274889,0,'Action completed, no processing required'),
(39,46,0,'2026-10-13 17:16:12',0,0,0,'Run mode: CLI'),
(40,46,39,'2026-10-13 17:16:12',2,0.026644,0,'Action completed, no processing required'),
(41,46,0,'2026-10-13 17:17:13',0,0,0,'Run mode: CLI'),
(42,46,41,'2026-10-13 17:17:13',2,0.142886,0,'Action completed, no processing required'),
(43,46,0,'2026-10-13 17:18:13',0,0,0,'Run mode: CLI'),
(44,46,43,'2026-10-13 17:18:13',2,0.0275722,0,'Action completed, no processing required'),
(45,46,0,'2026-10-13 17:19:14',0,0,0,'Run mode: CLI'),
(46,46,45,'2026-10-13 17:19:14',2,0.0361228,0,'Action completed, no processing required'),
(47,46,0,'2026-10-13 17:20:14',0,0,0,'Run mode: CLI'),
(48,46,47,'2026-10-13 17:20:14',2,0.020328,0,'Action completed, no processing required'),
(49,9,0,'2026-10-13 17:20:27',0,0,0,'Run mode: GLPI'),
(50,9,49,'2026-10-13 17:20:27',2,0.0202372,0,'Action completed, no processing required'),
(51,46,0,'2026-10-13 17:21:14',0,0,0,'Run mode: CLI'),
(52,46,51,'2026-10-13 17:21:14',2,0.019424,0,'Action completed, no processing required'),
(53,46,0,'2026-10-13 17:22:14',0,0,0,'Run mode: CLI'),
(54,46,53,'2026-10-13 17:22:14',2,0.0223231,0,'Action completed, no processing required'),
(55,46,0,'2026-10-13 17:23:14',0,0,0,'Run mode: CLI'),
(56,46,55,'2026-10-13 17:23:14',2,0.0332642,0,'Action completed, no processing required'),
(57,46,0,'2026-10-13 17:24:15',0,0,0,'Run mode: CLI'),
(58,46,57,'2026-10-13 17:24:15',2,0.026264,0,'Action completed, no processing required'),
(59,46,0,'2026-10-13 17:25:15',0,0,0,'Run mode: CLI'),
(60,46,59,'2026-10-13 17:25:15',2,0.0232968,0,'Action completed, no processing required'),
(61,46,0,'2026-10-13 17:26:15',0,0,0,'Run mode: CLI'),
(62,46,61,'2026-10-13 17:26:15',2,0.0210168,0,'Action completed, no processing required'),
(63,46,0,'2026-10-13 17:27:15',0,0,0,'Run mode: CLI'),
(64,46,63,'2026-10-13 17:27:15',2,0.020417,0,'Action completed, no processing required'),
(65,46,0,'2026-10-13 17:28:16',0,0,0,'Run mode: CLI'),
(66,46,65,'2026-10-13 17:28:16',2,0.0209711,0,'Action completed, no processing required'),
(67,46,0,'2026-10-13 17:29:16',0,0,0,'Run mode: CLI'),
(68,46,67,'2026-10-13 17:29:16',2,0.026546,0,'Action completed, no processing required'),
(69,12,0,'2026-10-13 17:29:32',0,0,0,'Run mode: GLPI'),
(70,12,69,'2026-10-13 17:29:32',2,0.0110998,0,'Action completed, no processing required'),
(71,46,0,'2026-10-13 17:30:16',0,0,0,'Run mode: CLI'),
(72,46,71,'2026-10-13 17:30:16',2,0.0208309,0,'Action completed, no processing required'),
(73,46,0,'2026-10-13 17:31:16',0,0,0,'Run mode: CLI'),
(74,46,73,'2026-10-13 17:31:16',2,0.0480769,0,'Action completed, no processing required'),
(75,46,0,'2026-10-13 17:32:17',0,0,0,'Run mode: CLI'),
(76,46,75,'2026-10-13 17:32:17',2,0.0672779,0,'Action completed, no processing required'),
(77,42,0,'2026-10-13 17:33:17',0,0,0,'Run mode: CLI'),
(78,42,77,'2026-10-13 17:33:17',2,0.060199,0,'Action completed, fully processed'),
(79,46,0,'2026-10-13 17:33:17',0,0,0,'Run mode: CLI'),
(80,46,79,'2026-10-13 17:33:17',2,0.011009,0,'Action completed, no processing required'),
(81,46,0,'2026-10-13 17:34:17',0,0,0,'Run mode: CLI'),
(82,46,81,'2026-10-13 17:34:17',2,0.0333619,0,'Action completed, no processing required'),
(83,13,0,'2026-10-13 17:34:38',0,0,0,'Run mode: GLPI'),
(84,13,83,'2026-10-13 17:34:38',2,0.0140469,0,'Action completed, no processing required'),
(85,46,0,'2026-10-13 17:35:18',0,0,0,'Run mode: CLI'),
(86,46,85,'2026-10-13 17:35:18',2,0.0202079,0,'Action completed, no processing required'),
(87,46,0,'2026-10-13 17:36:18',0,0,0,'Run mode: CLI'),
(88,46,87,'2026-10-13 17:36:18',2,0.025332,0,'Action completed, no processing required'),
(89,46,0,'2026-10-13 17:37:18',0,0,0,'Run mode: CLI'),
(90,46,89,'2026-10-13 17:37:18',2,0.0300212,0,'Action completed, no processing required'),
(91,46,0,'2026-10-13 17:38:18',0,0,0,'Run mode: CLI'),
(92,46,91,'2026-10-13 17:38:18',2,0.0242171,0,'Action completed, no processing required'),
(93,46,0,'2026-10-13 17:39:18',0,0,0,'Run mode: CLI'),
(94,46,93,'2026-10-13 17:39:18',2,0.0244739,0,'Action completed, no processing required'),
(95,46,0,'2026-10-13 17:40:19',0,0,0,'Run mode: CLI'),
(96,46,95,'2026-10-13 17:40:19',2,0.0351629,0,'Action completed, no processing required'),
(97,46,0,'2026-10-13 17:41:19',0,0,0,'Run mode: CLI'),
(98,46,97,'2026-10-13 17:41:19',2,0.0238061,0,'Action completed, no processing required'),
(99,46,0,'2026-10-13 17:42:19',0,0,0,'Run mode: CLI'),
(100,46,99,'2026-10-13 17:42:19',2,0.0410318,0,'Action completed, no processing required'),
(101,14,0,'2026-10-13 17:42:21',0,0,0,'Run mode: GLPI'),
(102,14,101,'2026-10-13 17:42:21',2,0.012352,0,'Action completed, no processing required'),
(103,46,0,'2026-10-13 17:43:20',0,0,0,'Run mode: CLI'),
(104,46,103,'2026-10-13 17:43:20',2,0.0228291,0,'Action completed, no processing required'),
(105,46,0,'2026-10-13 17:44:20',0,0,0,'Run mode: CLI'),
(106,46,105,'2026-10-13 17:44:20',2,0.0211639,0,'Action completed, no processing required'),
(107,46,0,'2026-10-13 17:45:20',0,0,0,'Run mode: CLI'),
(108,46,107,'2026-10-13 17:45:20',2,0.0276461,0,'Action completed, no processing required'),
(109,46,0,'2026-10-13 17:46:20',0,0,0,'Run mode: CLI'),
(110,46,109,'2026-10-13 17:46:20',2,0.0220609,0,'Action completed, no processing required'),
(111,46,0,'2026-10-13 17:47:21',0,0,0,'Run mode: CLI'),
(112,46,111,'2026-10-13 17:47:21',2,0.0723679,0,'Action completed, no processing required'),
(113,46,0,'2026-10-13 17:48:21',0,0,0,'Run mode: CLI'),
(114,46,113,'2026-10-13 17:48:21',2,0.029475,0,'Action completed, no processing required'),
(115,46,0,'2026-10-13 17:49:21',0,0,0,'Run mode: CLI'),
(116,46,115,'2026-10-13 17:49:21',2,0.0255821,0,'Action completed, no processing required'),
(117,46,0,'2026-10-13 17:50:22',0,0,0,'Run mode: CLI'),
(118,46,117,'2026-10-13 17:50:22',2,0.0221119,0,'Action completed, no processing required'),
(119,46,0,'2026-10-13 17:51:22',0,0,0,'Run mode: CLI'),
(120,46,119,'2026-10-13 17:51:22',2,0.0240781,0,'Action completed, no processing required'),
(121,46,0,'2026-10-13 17:52:22',0,0,0,'Run mode: CLI'),
(122,46,121,'2026-10-13 17:52:22',2,0.022871,0,'Action completed, no processing required'),
(123,46,0,'2026-10-13 17:53:22',0,0,0,'Run mode: CLI'),
(124,46,123,'2026-10-13 17:53:22',2,0.033061,0,'Action completed, no processing required'),
(125,46,0,'2026-10-13 17:54:23',0,0,0,'Run mode: CLI'),
(126,46,125,'2026-10-13 17:54:23',2,0.0243671,0,'Action completed, no processing required'),
(127,46,0,'2026-10-13 17:55:23',0,0,0,'Run mode: CLI'),
(128,46,127,'2026-10-13 17:55:23',2,0.022388,0,'Action completed, no processing required'),
(129,46,0,'2026-10-13 17:56:23',0,0,0,'Run mode: CLI'),
(130,46,129,'2026-10-13 17:56:23',2,0.0412428,0,'Action completed, no processing required'),
(131,46,0,'2026-10-13 17:57:23',0,0,0,'Run mode: CLI'),
(132,46,131,'2026-10-13 17:57:23',2,0.027364,0,'Action completed, no processing required'),
(133,46,0,'2026-10-13 17:58:24',0,0,0,'Run mode: CLI'),
(134,46,133,'2026-10-13 17:58:24',2,0.026906,0,'Action completed, no processing required'),
(135,46,0,'2026-10-13 17:59:24',0,0,0,'Run mode: CLI'),
(136,46,135,'2026-10-13 17:59:24',2,0.021369,0,'Action completed, no processing required'),
(137,46,0,'2026-10-13 18:00:24',0,0,0,'Run mode: CLI'),
(138,46,137,'2026-10-13 18:00:24',2,0.0228782,0,'Action completed, no processing required'),
(139,46,0,'2026-10-13 18:01:24',0,0,0,'Run mode: CLI'),
(140,46,139,'2026-10-13 18:01:24',2,0.0203691,0,'Action completed, no processing required'),
(141,46,0,'2026-10-13 18:02:25',0,0,0,'Run mode: CLI'),
(142,46,141,'2026-10-13 18:02:25',2,0.0207341,0,'Action completed, no processing required'),
(143,42,0,'2026-10-13 18:03:25',0,0,0,'Run mode: CLI'),
(144,42,143,'2026-10-13 18:03:25',2,0.055609,0,'Action completed, fully processed'),
(145,46,0,'2026-10-13 18:03:25',0,0,0,'Run mode: CLI'),
(146,46,145,'2026-10-13 18:03:25',2,0.015913,0,'Action completed, no processing required'),
(147,46,0,'2026-10-13 18:04:25',0,0,0,'Run mode: CLI'),
(148,46,147,'2026-10-13 18:04:25',2,0.0259469,0,'Action completed, no processing required'),
(149,46,0,'2026-10-13 18:05:25',0,0,0,'Run mode: CLI'),
(150,46,149,'2026-10-13 18:05:25',2,0.0275071,0,'Action completed, no processing required'),
(151,46,0,'2026-10-13 18:06:26',0,0,0,'Run mode: CLI'),
(152,46,151,'2026-10-13 18:06:26',2,0.100086,0,'Action completed, no processing required'),
(153,46,0,'2026-10-13 18:07:26',0,0,0,'Run mode: CLI'),
(154,46,153,'2026-10-13 18:07:26',2,0.071944,0,'Action completed, no processing required'),
(155,46,0,'2026-10-13 18:08:26',0,0,0,'Run mode: CLI'),
(156,46,155,'2026-10-13 18:08:26',2,0.0280781,0,'Action completed, no processing required'),
(157,46,0,'2026-10-13 18:09:26',0,0,0,'Run mode: CLI'),
(158,46,157,'2026-10-13 18:09:26',2,0.0330589,0,'Action completed, no processing required'),
(159,46,0,'2026-10-13 18:10:27',0,0,0,'Run mode: CLI'),
(160,46,159,'2026-10-13 18:10:27',2,0.032774,0,'Action completed, no processing required'),
(161,46,0,'2026-10-13 18:11:27',0,0,0,'Run mode: CLI'),
(162,46,161,'2026-10-13 18:11:27',2,0.034915,0,'Action completed, no processing required'),
(163,46,0,'2026-10-13 18:12:27',0,0,0,'Run mode: CLI'),
(164,46,163,'2026-10-13 18:12:27',2,0.0247979,0,'Action completed, no processing required'),
(165,46,0,'2026-10-13 18:13:27',0,0,0,'Run mode: CLI'),
(166,46,165,'2026-10-13 18:13:27',2,0.0330899,0,'Action completed, no processing required'),
(167,46,0,'2026-10-13 18:14:28',0,0,0,'Run mode: CLI'),
(168,46,167,'2026-10-13 18:14:28',2,0.029654,0,'Action completed, no processing required'),
(169,46,0,'2026-10-13 18:15:28',0,0,0,'Run mode: CLI'),
(170,46,169,'2026-10-13 18:15:28',2,0.025641,0,'Action completed, no processing required'),
(171,46,0,'2026-10-13 18:16:28',0,0,0,'Run mode: CLI'),
(172,46,171,'2026-10-13 18:16:28',2,0.0301521,0,'Action completed, no processing required'),
(173,46,0,'2026-10-13 18:17:28',0,0,0,'Run mode: CLI'),
(174,46,173,'2026-10-13 18:17:28',2,0.0288711,0,'Action completed, no processing required'),
(175,46,0,'2026-10-13 18:18:29',0,0,0,'Run mode: CLI'),
(176,46,175,'2026-10-13 18:18:29',2,0.0471132,0,'Action completed, no processing required'),
(177,46,0,'2026-10-13 18:19:29',0,0,0,'Run mode: CLI'),
(178,46,177,'2026-10-13 18:19:29',2,0.0249929,0,'Action completed, no processing required'),
(179,46,0,'2026-10-13 18:20:29',0,0,0,'Run mode: CLI'),
(180,46,179,'2026-10-13 18:20:29',2,0.0266168,0,'Action completed, no processing required'),
(181,46,0,'2026-10-13 18:21:29',0,0,0,'Run mode: CLI'),
(182,46,181,'2026-10-13 18:21:29',2,0.035547,0,'Action completed, no processing required'),
(183,46,0,'2026-10-13 18:22:30',0,0,0,'Run mode: CLI'),
(184,46,183,'2026-10-13 18:22:30',2,0.0190301,0,'Action completed, no processing required'),
(185,46,0,'2026-10-13 18:23:30',0,0,0,'Run mode: CLI'),
(186,46,185,'2026-10-13 18:23:30',2,0.0227189,0,'Action completed, no processing required'),
(187,46,0,'2026-10-13 18:24:30',0,0,0,'Run mode: CLI'),
(188,46,187,'2026-10-13 18:24:30',2,0.0282331,0,'Action completed, no processing required'),
(189,46,0,'2026-10-13 18:25:30',0,0,0,'Run mode: CLI'),
(190,46,189,'2026-10-13 18:25:30',2,0.0285938,0,'Action completed, no processing required'),
(191,46,0,'2026-10-13 18:26:30',0,0,0,'Run mode: CLI'),
(192,46,191,'2026-10-13 18:26:30',2,0.0284212,0,'Action completed, no processing required'),
(193,46,0,'2026-10-13 18:27:31',0,0,0,'Run mode: CLI'),
(194,46,193,'2026-10-13 18:27:31',2,0.0299971,0,'Action completed, no processing required'),
(195,46,0,'2026-10-13 18:28:31',0,0,0,'Run mode: CLI'),
(196,46,195,'2026-10-13 18:28:31',2,0.026196,0,'Action completed, no processing required'),
(197,46,0,'2026-10-13 18:29:31',0,0,0,'Run mode: CLI'),
(198,46,197,'2026-10-13 18:29:31',2,0.0166512,0,'Action completed, no processing required'),
(199,46,0,'2026-10-13 18:30:31',0,0,0,'Run mode: CLI'),
(200,46,199,'2026-10-13 18:30:31',2,0.0529401,0,'Action completed, no processing required'),
(201,46,0,'2026-10-13 18:31:32',0,0,0,'Run mode: CLI'),
(202,46,201,'2026-10-13 18:31:32',2,0.0227001,0,'Action completed, no processing required'),
(203,46,0,'2026-10-13 18:32:32',0,0,0,'Run mode: CLI'),
(204,46,203,'2026-10-13 18:32:32',2,0.027874,0,'Action completed, no processing required'),
(205,42,0,'2026-10-13 18:33:32',0,0,0,'Run mode: CLI'),
(206,42,205,'2026-10-13 18:33:32',2,0.090214,0,'Action completed, fully processed'),
(207,46,0,'2026-10-13 18:33:32',0,0,0,'Run mode: CLI'),
(208,46,207,'2026-10-13 18:33:32',2,0.00723219,0,'Action completed, no processing required'),
(209,46,0,'2026-10-13 18:34:32',0,0,0,'Run mode: CLI'),
(210,46,209,'2026-10-13 18:34:32',2,0.029613,0,'Action completed, no processing required'),
(211,46,0,'2026-10-13 18:35:33',0,0,0,'Run mode: CLI'),
(212,46,211,'2026-10-13 18:35:33',2,0.0330451,0,'Action completed, no processing required'),
(213,46,0,'2026-10-13 18:36:33',0,0,0,'Run mode: CLI'),
(214,46,213,'2026-10-13 18:36:33',2,0.0193279,0,'Action completed, no processing required'),
(215,46,0,'2026-10-13 18:37:33',0,0,0,'Run mode: CLI'),
(216,46,215,'2026-10-13 18:37:33',2,0.0201161,0,'Action completed, no processing required'),
(217,46,0,'2026-10-13 18:38:33',0,0,0,'Run mode: CLI'),
(218,46,217,'2026-10-13 18:38:33',2,0.0221429,0,'Action completed, no processing required'),
(219,46,0,'2026-10-13 18:39:34',0,0,0,'Run mode: CLI'),
(220,46,219,'2026-10-13 18:39:34',2,0.0229132,0,'Action completed, no processing required'),
(221,46,0,'2026-10-13 18:40:34',0,0,0,'Run mode: CLI'),
(222,46,221,'2026-10-13 18:40:34',2,0.0328419,0,'Action completed, no processing required'),
(223,46,0,'2026-10-13 18:41:34',0,0,0,'Run mode: CLI'),
(224,46,223,'2026-10-13 18:41:34',2,0.0204868,0,'Action completed, no processing required'),
(225,46,0,'2026-10-13 18:42:34',0,0,0,'Run mode: CLI'),
(226,46,225,'2026-10-13 18:42:34',2,0.0191321,0,'Action completed, no processing required'),
(227,46,0,'2026-10-13 18:43:34',0,0,0,'Run mode: CLI'),
(228,46,227,'2026-10-13 18:43:34',2,0.026885,0,'Action completed, no processing required'),
(229,46,0,'2026-10-13 18:44:35',0,0,0,'Run mode: CLI'),
(230,46,229,'2026-10-13 18:44:35',2,0.0203118,0,'Action completed, no processing required'),
(231,46,0,'2026-10-13 18:45:35',0,0,0,'Run mode: CLI'),
(232,46,231,'2026-10-13 18:45:35',2,0.029464,0,'Action completed, no processing required'),
(233,46,0,'2026-10-13 18:46:35',0,0,0,'Run mode: CLI'),
(234,46,233,'2026-10-13 18:46:35',2,0.0238001,0,'Action completed, no processing required'),
(235,46,0,'2026-10-13 18:47:35',0,0,0,'Run mode: CLI'),
(236,46,235,'2026-10-13 18:47:35',2,0.0521569,0,'Action completed, no processing required'),
(237,46,0,'2026-10-13 18:48:36',0,0,0,'Run mode: CLI'),
(238,46,237,'2026-10-13 18:48:36',2,0.0287139,0,'Action completed, no processing required'),
(239,46,0,'2026-10-13 18:49:36',0,0,0,'Run mode: CLI'),
(240,46,239,'2026-10-13 18:49:36',2,0.0302651,0,'Action completed, no processing required'),
(241,46,0,'2026-10-13 18:50:36',0,0,0,'Run mode: CLI'),
(242,46,241,'2026-10-13 18:50:36',2,0.0439801,0,'Action completed, no processing required'),
(243,46,0,'2026-10-13 18:51:37',0,0,0,'Run mode: CLI'),
(244,46,243,'2026-10-13 18:51:37',2,0.029747,0,'Action completed, no processing required'),
(245,46,0,'2026-10-13 18:52:37',0,0,0,'Run mode: CLI'),
(246,46,245,'2026-10-13 18:52:37',2,0.0262411,0,'Action completed, no processing required'),
(247,46,0,'2026-10-13 18:53:38',0,0,0,'Run mode: CLI'),
(248,46,247,'2026-10-13 18:53:38',2,0.0357871,0,'Action completed, no processing required'),
(249,46,0,'2026-10-13 18:54:38',0,0,0,'Run mode: CLI'),
(250,46,249,'2026-10-13 18:54:38',2,0.0191488,0,'Action completed, no processing required'),
(251,46,0,'2026-10-13 18:55:38',0,0,0,'Run mode: CLI'),
(252,46,251,'2026-10-13 18:55:38',2,0.0273001,0,'Action completed, no processing required'),
(253,46,0,'2026-10-13 18:56:38',0,0,0,'Run mode: CLI'),
(254,46,253,'2026-10-13 18:56:38',2,0.0185499,0,'Action completed, no processing required'),
(255,46,0,'2026-10-13 18:57:39',0,0,0,'Run mode: CLI'),
(256,46,255,'2026-10-13 18:57:39',2,0.0256159,0,'Action completed, no processing required'),
(257,46,0,'2026-10-13 18:58:39',0,0,0,'Run mode: CLI'),
(258,46,257,'2026-10-13 18:58:39',2,0.0217741,0,'Action completed, no processing required'),
(259,46,0,'2026-10-13 18:59:39',0,0,0,'Run mode: CLI'),
(260,46,259,'2026-10-13 18:59:39',2,0.0230191,0,'Action completed, no processing required'),
(261,46,0,'2026-10-13 19:00:39',0,0,0,'Run mode: CLI'),
(262,46,261,'2026-10-13 19:00:39',2,0.038486,0,'Action completed, no processing required'),
(263,46,0,'2026-10-13 19:01:40',0,0,0,'Run mode: CLI'),
(264,46,263,'2026-10-13 19:01:40',2,0.033407,0,'Action completed, no processing required'),
(265,46,0,'2026-10-13 19:02:40',0,0,0,'Run mode: CLI'),
(266,46,265,'2026-10-13 19:02:40',2,0.0249,0,'Action completed, no processing required'),
(267,42,0,'2026-10-13 19:06:14',0,0,0,'Run mode: CLI'),
(268,42,267,'2026-10-13 19:06:14',2,0.143813,0,'Action completed, fully processed'),
(269,46,0,'2026-10-13 19:06:14',0,0,0,'Run mode: CLI'),
(270,46,269,'2026-10-13 19:06:14',2,0.00822401,0,'Action completed, no processing required'),
(271,46,0,'2026-10-13 19:07:14',0,0,0,'Run mode: CLI'),
(272,46,271,'2026-10-13 19:07:14',2,0.0256279,0,'Action completed, no processing required'),
(273,46,0,'2026-10-13 19:08:15',0,0,0,'Run mode: CLI'),
(274,46,273,'2026-10-13 19:08:15',2,0.0302248,0,'Action completed, no processing required'),
(275,46,0,'2026-10-13 19:09:15',0,0,0,'Run mode: CLI'),
(276,46,275,'2026-10-13 19:09:15',2,0.0457091,0,'Action completed, no processing required'),
(277,46,0,'2026-10-13 19:10:13',0,0,0,'Run mode: CLI'),
(278,46,277,'2026-10-13 19:10:13',2,0.0297461,0,'Action completed, no processing required'),
(279,46,0,'2026-10-13 19:11:13',0,0,0,'Run mode: CLI'),
(280,46,279,'2026-10-13 19:11:13',2,0.0205371,0,'Action completed, no processing required'),
(281,46,0,'2026-10-13 19:12:13',0,0,0,'Run mode: CLI'),
(282,46,281,'2026-10-13 19:12:13',2,0.0292161,0,'Action completed, no processing required'),
(283,46,0,'2026-10-13 19:13:13',0,0,0,'Run mode: CLI'),
(284,46,283,'2026-10-13 19:13:13',2,0.023617,0,'Action completed, no processing required'),
(285,46,0,'2026-10-13 19:14:14',0,0,0,'Run mode: CLI'),
(286,46,285,'2026-10-13 19:14:14',2,0.032253,0,'Action completed, no processing required'),
(287,46,0,'2026-10-13 19:15:14',0,0,0,'Run mode: CLI'),
(288,46,287,'2026-10-13 19:15:14',2,0.0278132,0,'Action completed, no processing required'),
(289,46,0,'2026-10-13 19:16:14',0,0,0,'Run mode: CLI'),
(290,46,289,'2026-10-13 19:16:14',2,0.018611,0,'Action completed, no processing required'),
(291,46,0,'2026-10-13 19:17:14',0,0,0,'Run mode: CLI'),
(292,46,291,'2026-10-13 19:17:14',2,0.0236821,0,'Action completed, no processing required'),
(293,46,0,'2026-10-13 19:18:15',0,0,0,'Run mode: CLI'),
(294,46,293,'2026-10-13 19:18:15',2,0.0234451,0,'Action completed, no processing required'),
(295,46,0,'2026-10-13 19:19:15',0,0,0,'Run mode: CLI'),
(296,46,295,'2026-10-13 19:19:15',2,0.022454,0,'Action completed, no processing required'),
(297,46,0,'2026-10-13 19:20:15',0,0,0,'Run mode: CLI'),
(298,46,297,'2026-10-13 19:20:15',2,0.0251729,0,'Action completed, no processing required'),
(299,46,0,'2026-10-13 19:21:15',0,0,0,'Run mode: CLI'),
(300,46,299,'2026-10-13 19:21:15',2,0.023263,0,'Action completed, no processing required'),
(301,15,0,'2026-10-13 19:21:46',0,0,0,'Run mode: GLPI'),
(302,15,301,'2026-10-13 19:21:46',2,0.0302839,0,'Action completed, no processing required'),
(303,46,0,'2026-10-13 19:22:16',0,0,0,'Run mode: CLI'),
(304,46,303,'2026-10-13 19:22:16',2,0.0203409,0,'Action completed, no processing required'),
(305,46,0,'2026-10-13 19:23:16',0,0,0,'Run mode: CLI'),
(306,46,305,'2026-10-13 19:23:16',2,0.0288739,0,'Action completed, no processing required'),
(307,46,0,'2026-10-13 19:24:16',0,0,0,'Run mode: CLI'),
(308,46,307,'2026-10-13 19:24:16',2,0.0385191,0,'Action completed, no processing required'),
(309,46,0,'2026-10-13 19:25:16',0,0,0,'Run mode: CLI'),
(310,46,309,'2026-10-13 19:25:16',2,0.0257061,0,'Action completed, no processing required'),
(311,46,0,'2026-10-13 19:26:17',0,0,0,'Run mode: CLI'),
(312,46,311,'2026-10-13 19:26:17',2,0.0228488,0,'Action completed, no processing required'),
(313,46,0,'2026-10-13 19:27:17',0,0,0,'Run mode: CLI'),
(314,46,313,'2026-10-13 19:27:17',2,0.029428,0,'Action completed, no processing required'),
(315,46,0,'2026-10-13 19:28:17',0,0,0,'Run mode: CLI'),
(316,46,315,'2026-10-13 19:28:17',2,0.024816,0,'Action completed, no processing required'),
(317,46,0,'2026-10-13 19:29:17',0,0,0,'Run mode: CLI'),
(318,46,317,'2026-10-13 19:29:17',2,0.028903,0,'Action completed, no processing required'),
(319,46,0,'2026-10-13 19:30:18',0,0,0,'Run mode: CLI'),
(320,46,319,'2026-10-13 19:30:18',2,0.019177,0,'Action completed, no processing required'),
(321,46,0,'2026-10-13 19:31:18',0,0,0,'Run mode: CLI'),
(322,46,321,'2026-10-13 19:31:18',2,0.024868,0,'Action completed, no processing required'),
(323,46,0,'2026-10-13 19:32:18',0,0,0,'Run mode: CLI'),
(324,46,323,'2026-10-13 19:32:18',2,0.0211,0,'Action completed, no processing required'),
(325,46,0,'2026-10-13 19:33:18',0,0,0,'Run mode: CLI'),
(326,46,325,'2026-10-13 19:33:18',2,0.022337,0,'Action completed, no processing required'),
(327,46,0,'2026-10-13 19:34:19',0,0,0,'Run mode: CLI'),
(328,46,327,'2026-10-13 19:34:19',2,0.024482,0,'Action completed, no processing required'),
(329,46,0,'2026-10-13 19:35:19',0,0,0,'Run mode: CLI'),
(330,46,329,'2026-10-13 19:35:19',2,0.02248,0,'Action completed, no processing required'),
(331,42,0,'2026-10-13 19:36:19',0,0,0,'Run mode: CLI'),
(332,42,331,'2026-10-13 19:36:19',2,0.0604551,0,'Action completed, fully processed'),
(333,46,0,'2026-10-13 19:36:19',0,0,0,'Run mode: CLI'),
(334,46,333,'2026-10-13 19:36:19',2,0.00874591,0,'Action completed, no processing required'),
(335,46,0,'2026-10-13 19:37:19',0,0,0,'Run mode: CLI'),
(336,46,335,'2026-10-13 19:37:19',2,0.021662,0,'Action completed, no processing required'),
(337,46,0,'2026-10-13 19:38:20',0,0,0,'Run mode: CLI'),
(338,46,337,'2026-10-13 19:38:20',2,0.023185,0,'Action completed, no processing required'),
(339,46,0,'2026-10-13 19:39:20',0,0,0,'Run mode: CLI'),
(340,46,339,'2026-10-13 19:39:20',2,0.02702,0,'Action completed, no processing required'),
(341,46,0,'2026-10-13 19:40:20',0,0,0,'Run mode: CLI'),
(342,46,341,'2026-10-13 19:40:20',2,0.0393579,0,'Action completed, no processing required'),
(343,46,0,'2026-10-13 19:41:20',0,0,0,'Run mode: CLI'),
(344,46,343,'2026-10-13 19:41:20',2,0.0242531,0,'Action completed, no processing required'),
(345,46,0,'2026-10-13 19:42:21',0,0,0,'Run mode: CLI'),
(346,46,345,'2026-10-13 19:42:21',2,0.023226,0,'Action completed, no processing required'),
(347,46,0,'2026-10-13 19:43:21',0,0,0,'Run mode: CLI'),
(348,46,347,'2026-10-13 19:43:21',2,0.0216269,0,'Action completed, no processing required'),
(349,46,0,'2026-10-13 19:44:21',0,0,0,'Run mode: CLI'),
(350,46,349,'2026-10-13 19:44:21',2,0.0368788,0,'Action completed, no processing required'),
(351,46,0,'2026-10-13 19:45:21',0,0,0,'Run mode: CLI'),
(352,46,351,'2026-10-13 19:45:21',2,0.0206082,0,'Action completed, no processing required'),
(353,46,0,'2026-10-13 19:46:22',0,0,0,'Run mode: CLI'),
(354,46,353,'2026-10-13 19:46:22',2,0.0426769,0,'Action completed, no processing required'),
(355,46,0,'2026-10-13 19:47:22',0,0,0,'Run mode: CLI'),
(356,46,355,'2026-10-13 19:47:22',2,0.019676,0,'Action completed, no processing required'),
(357,46,0,'2026-10-13 19:48:22',0,0,0,'Run mode: CLI'),
(358,46,357,'2026-10-13 19:48:22',2,0.023201,0,'Action completed, no processing required'),
(359,46,0,'2026-10-13 19:49:22',0,0,0,'Run mode: CLI'),
(360,46,359,'2026-10-13 19:49:22',2,0.0248921,0,'Action completed, no processing required'),
(361,46,0,'2026-10-13 19:50:22',0,0,0,'Run mode: CLI'),
(362,46,361,'2026-10-13 19:50:22',2,0.0193651,0,'Action completed, no processing required'),
(363,46,0,'2026-10-13 19:51:23',0,0,0,'Run mode: CLI'),
(364,46,363,'2026-10-13 19:51:23',2,0.0251911,0,'Action completed, no processing required'),
(365,46,0,'2026-10-13 19:52:23',0,0,0,'Run mode: CLI'),
(366,46,365,'2026-10-13 19:52:23',2,0.0253179,0,'Action completed, no processing required'),
(367,46,0,'2026-10-13 19:53:23',0,0,0,'Run mode: CLI'),
(368,46,367,'2026-10-13 19:53:23',2,0.0273039,0,'Action completed, no processing required'),
(369,46,0,'2026-10-13 19:54:23',0,0,0,'Run mode: CLI'),
(370,46,369,'2026-10-13 19:54:23',2,0.0205269,0,'Action completed, no processing required'),
(371,46,0,'2026-10-13 19:55:24',0,0,0,'Run mode: CLI'),
(372,46,371,'2026-10-13 19:55:24',2,0.0208831,0,'Action completed, no processing required'),
(373,46,0,'2026-10-13 19:56:24',0,0,0,'Run mode: CLI'),
(374,46,373,'2026-10-13 19:56:24',2,0.0255132,0,'Action completed, no processing required'),
(375,46,0,'2026-10-13 19:57:24',0,0,0,'Run mode: CLI'),
(376,46,375,'2026-10-13 19:57:24',2,0.0198519,0,'Action completed, no processing required'),
(377,46,0,'2026-10-13 19:58:24',0,0,0,'Run mode: CLI'),
(378,46,377,'2026-10-13 19:58:24',2,0.0227399,0,'Action completed, no processing required'),
(379,46,0,'2026-10-13 19:59:24',0,0,0,'Run mode: CLI'),
(380,46,379,'2026-10-13 19:59:24',2,0.0273049,0,'Action completed, no processing required'),
(381,46,0,'2026-10-13 20:00:25',0,0,0,'Run mode: CLI'),
(382,46,381,'2026-10-13 20:00:25',2,0.0197349,0,'Action completed, no processing required'),
(383,46,0,'2026-10-13 20:01:25',0,0,0,'Run mode: CLI'),
(384,46,383,'2026-10-13 20:01:25',2,0.0234199,0,'Action completed, no processing required'),
(385,46,0,'2026-10-13 20:02:25',0,0,0,'Run mode: CLI'),
(386,46,385,'2026-10-13 20:02:25',2,0.0204132,0,'Action completed, no processing required'),
(387,46,0,'2026-10-13 20:03:25',0,0,0,'Run mode: CLI'),
(388,46,387,'2026-10-13 20:03:25',2,0.0215812,0,'Action completed, no processing required'),
(389,46,0,'2026-10-13 20:04:26',0,0,0,'Run mode: CLI'),
(390,46,389,'2026-10-13 20:04:26',2,0.027797,0,'Action completed, no processing required'),
(391,46,0,'2026-10-13 20:05:26',0,0,0,'Run mode: CLI'),
(392,46,391,'2026-10-13 20:05:26',2,0.023042,0,'Action completed, no processing required'),
(393,42,0,'2026-10-13 20:06:26',0,0,0,'Run mode: CLI'),
(394,42,393,'2026-10-13 20:06:26',2,0.054599,0,'Action completed, fully processed'),
(395,46,0,'2026-10-13 20:06:26',0,0,0,'Run mode: CLI'),
(396,46,395,'2026-10-13 20:06:26',2,0.00843787,0,'Action completed, no processing required'),
(397,46,0,'2026-10-13 20:07:26',0,0,0,'Run mode: CLI'),
(398,46,397,'2026-10-13 20:07:26',2,0.0220299,0,'Action completed, no processing required'),
(399,46,0,'2026-10-13 20:08:27',0,0,0,'Run mode: CLI'),
(400,46,399,'2026-10-13 20:08:27',2,0.030576,0,'Action completed, no processing required'),
(401,46,0,'2026-10-13 20:09:27',0,0,0,'Run mode: CLI'),
(402,46,401,'2026-10-13 20:09:27',2,0.0202222,0,'Action completed, no processing required'),
(403,46,0,'2026-10-13 20:10:27',0,0,0,'Run mode: CLI'),
(404,46,403,'2026-10-13 20:10:27',2,0.0339029,0,'Action completed, no processing required'),
(405,46,0,'2026-10-13 20:11:27',0,0,0,'Run mode: CLI'),
(406,46,405,'2026-10-13 20:11:27',2,0.0239389,0,'Action completed, no processing required'),
(407,46,0,'2026-10-13 20:12:28',0,0,0,'Run mode: CLI'),
(408,46,407,'2026-10-13 20:12:28',2,0.0229771,0,'Action completed, no processing required'),
(409,46,0,'2026-10-13 20:13:28',0,0,0,'Run mode: CLI'),
(410,46,409,'2026-10-13 20:13:28',2,0.0246611,0,'Action completed, no processing required'),
(411,46,0,'2026-10-13 20:14:28',0,0,0,'Run mode: CLI'),
(412,46,411,'2026-10-13 20:14:28',2,0.027936,0,'Action completed, no processing required'),
(413,46,0,'2026-10-13 20:15:28',0,0,0,'Run mode: CLI'),
(414,46,413,'2026-10-13 20:15:28',2,0.0221331,0,'Action completed, no processing required'),
(415,46,0,'2026-10-13 20:16:28',0,0,0,'Run mode: CLI'),
(416,46,415,'2026-10-13 20:16:28',2,0.0252671,0,'Action completed, no processing required'),
(417,46,0,'2026-10-13 20:17:29',0,0,0,'Run mode: CLI'),
(418,46,417,'2026-10-13 20:17:29',2,0.021625,0,'Action completed, no processing required'),
(419,46,0,'2026-10-13 20:18:29',0,0,0,'Run mode: CLI'),
(420,46,419,'2026-10-13 20:18:29',2,0.030457,0,'Action completed, no processing required'),
(421,46,0,'2026-10-13 20:19:29',0,0,0,'Run mode: CLI'),
(422,46,421,'2026-10-13 20:19:29',2,0.030818,0,'Action completed, no processing required'),
(423,46,0,'2026-10-13 20:20:29',0,0,0,'Run mode: CLI'),
(424,46,423,'2026-10-13 20:20:29',2,0.0245838,0,'Action completed, no processing required'),
(425,46,0,'2026-10-13 20:21:30',0,0,0,'Run mode: CLI'),
(426,46,425,'2026-10-13 20:21:30',2,0.03227,0,'Action completed, no processing required'),
(427,46,0,'2026-10-13 20:22:30',0,0,0,'Run mode: CLI'),
(428,46,427,'2026-10-13 20:22:30',2,0.0263379,0,'Action completed, no processing required'),
(429,46,0,'2026-10-13 20:23:30',0,0,0,'Run mode: CLI'),
(430,46,429,'2026-10-13 20:23:30',2,0.0357451,0,'Action completed, no processing required'),
(431,46,0,'2026-10-13 20:24:31',0,0,0,'Run mode: CLI'),
(432,46,431,'2026-10-13 20:24:31',2,0.02566,0,'Action completed, no processing required'),
(433,46,0,'2026-10-13 20:25:31',0,0,0,'Run mode: CLI'),
(434,46,433,'2026-10-13 20:25:31',2,0.0235159,0,'Action completed, no processing required'),
(435,46,0,'2026-10-13 20:26:31',0,0,0,'Run mode: CLI'),
(436,46,435,'2026-10-13 20:26:31',2,0.0221789,0,'Action completed, no processing required'),
(437,46,0,'2026-10-13 20:27:31',0,0,0,'Run mode: CLI'),
(438,46,437,'2026-10-13 20:27:31',2,0.0210021,0,'Action completed, no processing required'),
(439,46,0,'2026-10-13 20:28:32',0,0,0,'Run mode: CLI'),
(440,46,439,'2026-10-13 20:28:32',2,0.027179,0,'Action completed, no processing required'),
(441,46,0,'2026-10-13 20:29:32',0,0,0,'Run mode: CLI'),
(442,46,441,'2026-10-13 20:29:32',2,0.0216069,0,'Action completed, no processing required'),
(443,46,0,'2026-10-13 20:30:32',0,0,0,'Run mode: CLI'),
(444,46,443,'2026-10-13 20:30:32',2,0.0265861,0,'Action completed, no processing required'),
(445,46,0,'2026-10-13 20:31:32',0,0,0,'Run mode: CLI'),
(446,46,445,'2026-10-13 20:31:32',2,0.021107,0,'Action completed, no processing required'),
(447,46,0,'2026-10-13 20:32:33',0,0,0,'Run mode: CLI'),
(448,46,447,'2026-10-13 20:32:33',2,0.0243888,0,'Action completed, no processing required'),
(449,46,0,'2026-10-13 20:33:33',0,0,0,'Run mode: CLI'),
(450,46,449,'2026-10-13 20:33:33',2,0.0231309,0,'Action completed, no processing required'),
(451,46,0,'2026-10-13 20:34:33',0,0,0,'Run mode: CLI'),
(452,46,451,'2026-10-13 20:34:33',2,0.0207801,0,'Action completed, no processing required'),
(453,46,0,'2026-10-13 20:35:33',0,0,0,'Run mode: CLI'),
(454,46,453,'2026-10-13 20:35:33',2,0.0257521,0,'Action completed, no processing required'),
(455,42,0,'2026-10-13 20:36:34',0,0,0,'Run mode: CLI'),
(456,42,455,'2026-10-13 20:36:34',2,0.064189,0,'Action completed, fully processed'),
(457,46,0,'2026-10-13 20:36:34',0,0,0,'Run mode: CLI'),
(458,46,457,'2026-10-13 20:36:34',2,0.0110569,0,'Action completed, no processing required'),
(459,46,0,'2026-10-13 20:37:34',0,0,0,'Run mode: CLI'),
(460,46,459,'2026-10-13 20:37:34',2,0.0242231,0,'Action completed, no processing required'),
(461,46,0,'2026-10-13 20:38:34',0,0,0,'Run mode: CLI'),
(462,46,461,'2026-10-13 20:38:34',2,0.0233691,0,'Action completed, no processing required'),
(463,46,0,'2026-10-13 20:39:34',0,0,0,'Run mode: CLI'),
(464,46,463,'2026-10-13 20:39:34',2,0.0262251,0,'Action completed, no processing required'),
(465,46,0,'2026-10-13 20:40:34',0,0,0,'Run mode: CLI'),
(466,46,465,'2026-10-13 20:40:34',2,0.0269849,0,'Action completed, no processing required'),
(467,46,0,'2026-10-13 20:41:35',0,0,0,'Run mode: CLI'),
(468,46,467,'2026-10-13 20:41:35',2,0.0254209,0,'Action completed, no processing required'),
(469,46,0,'2026-10-13 20:42:35',0,0,0,'Run mode: CLI'),
(470,46,469,'2026-10-13 20:42:35',2,0.0226111,0,'Action completed, no processing required'),
(471,46,0,'2026-10-13 20:43:35',0,0,0,'Run mode: CLI'),
(472,46,471,'2026-10-13 20:43:35',2,0.0237839,0,'Action completed, no processing required'),
(473,46,0,'2026-10-13 20:44:35',0,0,0,'Run mode: CLI'),
(474,46,473,'2026-10-13 20:44:35',2,0.019582,0,'Action completed, no processing required'),
(475,46,0,'2026-10-13 20:45:36',0,0,0,'Run mode: CLI'),
(476,46,475,'2026-10-13 20:45:36',2,0.023834,0,'Action completed, no processing required'),
(477,46,0,'2026-10-13 20:46:36',0,0,0,'Run mode: CLI'),
(478,46,477,'2026-10-13 20:46:36',2,0.0224581,0,'Action completed, no processing required'),
(479,46,0,'2026-10-13 20:47:36',0,0,0,'Run mode: CLI'),
(480,46,479,'2026-10-13 20:47:36',2,0.022316,0,'Action completed, no processing required'),
(481,46,0,'2026-10-13 20:48:36',0,0,0,'Run mode: CLI'),
(482,46,481,'2026-10-13 20:48:36',2,0.0234311,0,'Action completed, no processing required'),
(483,46,0,'2026-10-13 20:49:37',0,0,0,'Run mode: CLI'),
(484,46,483,'2026-10-13 20:49:37',2,0.031389,0,'Action completed, no processing required'),
(485,46,0,'2026-10-13 20:50:37',0,0,0,'Run mode: CLI'),
(486,46,485,'2026-10-13 20:50:37',2,0.026825,0,'Action completed, no processing required'),
(487,46,0,'2026-10-13 20:51:37',0,0,0,'Run mode: CLI'),
(488,46,487,'2026-10-13 20:51:37',2,0.022526,0,'Action completed, no processing required'),
(489,46,0,'2026-10-13 20:52:37',0,0,0,'Run mode: CLI'),
(490,46,489,'2026-10-13 20:52:37',2,0.0218589,0,'Action completed, no processing required'),
(491,46,0,'2026-10-13 20:53:38',0,0,0,'Run mode: CLI'),
(492,46,491,'2026-10-13 20:53:38',2,0.0221229,0,'Action completed, no processing required'),
(493,46,0,'2026-10-13 20:54:38',0,0,0,'Run mode: CLI'),
(494,46,493,'2026-10-13 20:54:38',2,0.0261319,0,'Action completed, no processing required'),
(495,46,0,'2026-10-13 20:55:38',0,0,0,'Run mode: CLI'),
(496,46,495,'2026-10-13 20:55:38',2,0.0344839,0,'Action completed, no processing required'),
(497,46,0,'2026-10-13 20:56:38',0,0,0,'Run mode: CLI'),
(498,46,497,'2026-10-13 20:56:38',2,0.0217512,0,'Action completed, no processing required'),
(499,46,0,'2026-10-13 20:57:38',0,0,0,'Run mode: CLI'),
(500,46,499,'2026-10-13 20:57:38',2,0.022028,0,'Action completed, no processing required'),
(501,46,0,'2026-10-13 20:58:39',0,0,0,'Run mode: CLI'),
(502,46,501,'2026-10-13 20:58:39',2,0.02545,0,'Action completed, no processing required'),
(503,46,0,'2026-10-13 20:59:39',0,0,0,'Run mode: CLI'),
(504,46,503,'2026-10-13 20:59:39',2,0.028621,0,'Action completed, no processing required'),
(505,46,0,'2026-10-13 21:00:39',0,0,0,'Run mode: CLI'),
(506,46,505,'2026-10-13 21:00:39',2,0.0244248,0,'Action completed, no processing required'),
(507,46,0,'2026-10-13 21:01:39',0,0,0,'Run mode: CLI'),
(508,46,507,'2026-10-13 21:01:39',2,0.031544,0,'Action completed, no processing required'),
(509,46,0,'2026-10-13 21:02:40',0,0,0,'Run mode: CLI'),
(510,46,509,'2026-10-13 21:02:40',2,0.0384109,0,'Action completed, no processing required'),
(511,46,0,'2026-10-13 21:03:40',0,0,0,'Run mode: CLI'),
(512,46,511,'2026-10-13 21:03:40',2,0.040185,0,'Action completed, no processing required'),
(513,46,0,'2026-10-13 21:04:40',0,0,0,'Run mode: CLI'),
(514,46,513,'2026-10-13 21:04:40',2,0.0281858,0,'Action completed, no processing required'),
(515,46,0,'2026-10-13 21:05:41',0,0,0,'Run mode: CLI'),
(516,46,515,'2026-10-13 21:05:41',2,0.0205989,0,'Action completed, no processing required'),
(517,42,0,'2026-10-13 21:06:41',0,0,0,'Run mode: CLI'),
(518,42,517,'2026-10-13 21:06:41',2,0.053169,0,'Action completed, fully processed'),
(519,46,0,'2026-10-13 21:06:41',0,0,0,'Run mode: CLI'),
(520,46,519,'2026-10-13 21:06:41',2,0.010561,0,'Action completed, no processing required'),
(521,46,0,'2026-10-13 21:07:41',0,0,0,'Run mode: CLI'),
(522,46,521,'2026-10-13 21:07:41',2,0.0223172,0,'Action completed, no processing required'),
(523,46,0,'2026-10-13 21:08:41',0,0,0,'Run mode: CLI'),
(524,46,523,'2026-10-13 21:08:41',2,0.0202072,0,'Action completed, no processing required'),
(525,46,0,'2026-10-13 21:09:41',0,0,0,'Run mode: CLI'),
(526,46,525,'2026-10-13 21:09:41',2,0.0232661,0,'Action completed, no processing required'),
(527,46,0,'2026-10-13 21:10:42',0,0,0,'Run mode: CLI'),
(528,46,527,'2026-10-13 21:10:42',2,0.0318911,0,'Action completed, no processing required'),
(529,46,0,'2026-10-14 12:02:43',0,0,0,'Run mode: CLI'),
(530,46,529,'2026-10-14 12:02:43',2,0.028254,0,'Action completed, no processing required'),
(531,42,0,'2026-10-14 12:02:43',0,0,0,'Run mode: CLI'),
(532,42,531,'2026-10-14 12:02:43',2,0.0479131,0,'Action completed, fully processed'),
(533,46,0,'2026-10-14 12:03:59',0,0,0,'Run mode: CLI'),
(534,46,533,'2026-10-14 12:03:59',2,0.051908,0,'Action completed, no processing required'),
(535,46,0,'2026-10-14 12:05:00',0,0,0,'Run mode: CLI'),
(536,46,535,'2026-10-14 12:05:00',2,0.047688,0,'Action completed, no processing required'),
(537,46,0,'2026-10-14 12:06:00',0,0,0,'Run mode: CLI'),
(538,46,537,'2026-10-14 12:06:00',2,0.0285909,0,'Action completed, no processing required'),
(539,46,0,'2026-10-14 12:07:00',0,0,0,'Run mode: CLI'),
(540,46,539,'2026-10-14 12:07:00',2,0.0251851,0,'Action completed, no processing required'),
(541,46,0,'2026-10-14 12:08:00',0,0,0,'Run mode: CLI'),
(542,46,541,'2026-10-14 12:08:00',2,0.025933,0,'Action completed, no processing required'),
(543,46,0,'2026-10-14 12:09:01',0,0,0,'Run mode: CLI'),
(544,46,543,'2026-10-14 12:09:01',2,0.0238171,0,'Action completed, no processing required'),
(545,46,0,'2026-10-14 12:10:01',0,0,0,'Run mode: CLI'),
(546,46,545,'2026-10-14 12:10:01',2,0.0224679,0,'Action completed, no processing required'),
(547,46,0,'2026-10-14 12:11:01',0,0,0,'Run mode: CLI'),
(548,46,547,'2026-10-14 12:11:01',2,0.02194,0,'Action completed, no processing required'),
(549,46,0,'2026-10-14 12:12:01',0,0,0,'Run mode: CLI'),
(550,46,549,'2026-10-14 12:12:01',2,0.023047,0,'Action completed, no processing required'),
(551,46,0,'2026-10-14 12:13:02',0,0,0,'Run mode: CLI'),
(552,46,551,'2026-10-14 12:13:02',2,0.02932,0,'Action completed, no processing required'),
(553,46,0,'2026-10-14 12:14:02',0,0,0,'Run mode: CLI'),
(554,46,553,'2026-10-14 12:14:02',2,0.022779,0,'Action completed, no processing required'),
(555,46,0,'2026-10-14 12:15:02',0,0,0,'Run mode: CLI'),
(556,46,555,'2026-10-14 12:15:02',2,0.0703759,0,'Action completed, no processing required'),
(557,46,0,'2026-10-14 12:16:02',0,0,0,'Run mode: CLI'),
(558,46,557,'2026-10-14 12:16:02',2,0.0199511,0,'Action completed, no processing required'),
(559,46,0,'2026-10-14 12:17:03',0,0,0,'Run mode: CLI'),
(560,46,559,'2026-10-14 12:17:03',2,0.02105,0,'Action completed, no processing required'),
(561,46,0,'2026-10-14 12:18:03',0,0,0,'Run mode: CLI'),
(562,46,561,'2026-10-14 12:18:03',2,0.0218532,0,'Action completed, no processing required'),
(563,46,0,'2026-10-14 12:19:03',0,0,0,'Run mode: CLI'),
(564,46,563,'2026-10-14 12:19:03',2,0.0265131,0,'Action completed, no processing required'),
(565,46,0,'2026-10-14 12:20:03',0,0,0,'Run mode: CLI'),
(566,46,565,'2026-10-14 12:20:03',2,0.0218332,0,'Action completed, no processing required'),
(567,46,0,'2026-10-14 12:21:04',0,0,0,'Run mode: CLI'),
(568,46,567,'2026-10-14 12:21:04',2,0.0224321,0,'Action completed, no processing required'),
(569,46,0,'2026-10-14 12:22:04',0,0,0,'Run mode: CLI'),
(570,46,569,'2026-10-14 12:22:04',2,0.025151,0,'Action completed, no processing required'),
(571,46,0,'2026-10-14 12:23:04',0,0,0,'Run mode: CLI'),
(572,46,571,'2026-10-14 12:23:04',2,0.0199189,0,'Action completed, no processing required'),
(573,46,0,'2026-10-14 12:24:04',0,0,0,'Run mode: CLI'),
(574,46,573,'2026-10-14 12:24:04',2,0.019464,0,'Action completed, no processing required'),
(575,46,0,'2026-10-14 12:25:05',0,0,0,'Run mode: CLI'),
(576,46,575,'2026-10-14 12:25:05',2,0.021286,0,'Action completed, no processing required'),
(577,46,0,'2026-10-14 12:26:05',0,0,0,'Run mode: CLI'),
(578,46,577,'2026-10-14 12:26:05',2,0.022388,0,'Action completed, no processing required'),
(579,46,0,'2026-10-14 12:27:05',0,0,0,'Run mode: CLI'),
(580,46,579,'2026-10-14 12:27:05',2,0.0202041,0,'Action completed, no processing required'),
(581,46,0,'2026-10-14 12:28:05',0,0,0,'Run mode: CLI'),
(582,46,581,'2026-10-14 12:28:05',2,0.0229089,0,'Action completed, no processing required'),
(583,46,0,'2026-10-14 12:29:06',0,0,0,'Run mode: CLI'),
(584,46,583,'2026-10-14 12:29:06',2,0.0271819,0,'Action completed, no processing required'),
(585,46,0,'2026-10-14 12:30:06',0,0,0,'Run mode: CLI'),
(586,46,585,'2026-10-14 12:30:06',2,0.076854,0,'Action completed, no processing required'),
(587,46,0,'2026-10-14 12:31:06',0,0,0,'Run mode: CLI'),
(588,46,587,'2026-10-14 12:31:06',2,0.024827,0,'Action completed, no processing required'),
(589,42,0,'2026-10-14 12:32:07',0,0,0,'Run mode: CLI'),
(590,42,589,'2026-10-14 12:32:07',2,0.0539701,0,'Action completed, fully processed'),
(591,46,0,'2026-10-14 12:32:07',0,0,0,'Run mode: CLI'),
(592,46,591,'2026-10-14 12:32:07',2,0.00782585,0,'Action completed, no processing required'),
(593,46,0,'2026-10-14 12:33:07',0,0,0,'Run mode: CLI'),
(594,46,593,'2026-10-14 12:33:07',2,0.0212309,0,'Action completed, no processing required'),
(595,46,0,'2026-10-14 12:34:07',0,0,0,'Run mode: CLI'),
(596,46,595,'2026-10-14 12:34:07',2,0.075721,0,'Action completed, no processing required'),
(597,46,0,'2026-10-14 12:35:08',0,0,0,'Run mode: CLI'),
(598,46,597,'2026-10-14 12:35:08',2,0.0310171,0,'Action completed, no processing required'),
(599,46,0,'2026-10-14 12:36:08',0,0,0,'Run mode: CLI'),
(600,46,599,'2026-10-14 12:36:08',2,0.019547,0,'Action completed, no processing required'),
(601,46,0,'2026-10-14 12:37:08',0,0,0,'Run mode: CLI'),
(602,46,601,'2026-10-14 12:37:08',2,0.0190291,0,'Action completed, no processing required'),
(603,46,0,'2026-10-14 12:38:09',0,0,0,'Run mode: CLI'),
(604,46,603,'2026-10-14 12:38:09',2,0.022157,0,'Action completed, no processing required'),
(605,46,0,'2026-10-14 12:39:09',0,0,0,'Run mode: CLI'),
(606,46,605,'2026-10-14 12:39:09',2,0.0307209,0,'Action completed, no processing required'),
(607,46,0,'2026-10-14 12:40:09',0,0,0,'Run mode: CLI'),
(608,46,607,'2026-10-14 12:40:09',2,0.0261741,0,'Action completed, no processing required'),
(609,46,0,'2026-10-14 12:41:09',0,0,0,'Run mode: CLI'),
(610,46,609,'2026-10-14 12:41:09',2,0.0290961,0,'Action completed, no processing required'),
(611,46,0,'2026-10-14 12:42:10',0,0,0,'Run mode: CLI'),
(612,46,611,'2026-10-14 12:42:10',2,0.0264962,0,'Action completed, no processing required'),
(613,46,0,'2026-10-14 12:43:10',0,0,0,'Run mode: CLI'),
(614,46,613,'2026-10-14 12:43:10',2,0.0260389,0,'Action completed, no processing required'),
(615,46,0,'2026-10-14 12:44:10',0,0,0,'Run mode: CLI'),
(616,46,615,'2026-10-14 12:44:10',2,0.0273969,0,'Action completed, no processing required'),
(617,46,0,'2026-10-14 12:45:10',0,0,0,'Run mode: CLI'),
(618,46,617,'2026-10-14 12:45:10',2,0.0228581,0,'Action completed, no processing required'),
(619,46,0,'2026-10-14 12:46:11',0,0,0,'Run mode: CLI'),
(620,46,619,'2026-10-14 12:46:11',2,0.0215139,0,'Action completed, no processing required'),
(621,46,0,'2026-10-14 12:47:11',0,0,0,'Run mode: CLI'),
(622,46,621,'2026-10-14 12:47:11',2,0.022557,0,'Action completed, no processing required'),
(623,46,0,'2026-10-14 12:48:11',0,0,0,'Run mode: CLI'),
(624,46,623,'2026-10-14 12:48:11',2,0.018652,0,'Action completed, no processing required'),
(625,46,0,'2026-10-14 12:49:11',0,0,0,'Run mode: CLI'),
(626,46,625,'2026-10-14 12:49:11',2,0.0203528,0,'Action completed, no processing required'),
(627,46,0,'2026-10-14 12:50:12',0,0,0,'Run mode: CLI'),
(628,46,627,'2026-10-14 12:50:12',2,0.0316968,0,'Action completed, no processing required'),
(629,46,0,'2026-10-14 12:51:12',0,0,0,'Run mode: CLI'),
(630,46,629,'2026-10-14 12:51:12',2,0.024447,0,'Action completed, no processing required'),
(631,46,0,'2026-10-14 12:52:12',0,0,0,'Run mode: CLI'),
(632,46,631,'2026-10-14 12:52:12',2,0.0283141,0,'Action completed, no processing required'),
(633,46,0,'2026-10-14 12:53:12',0,0,0,'Run mode: CLI'),
(634,46,633,'2026-10-14 12:53:12',2,0.023191,0,'Action completed, no processing required'),
(635,46,0,'2026-10-14 12:54:13',0,0,0,'Run mode: CLI'),
(636,46,635,'2026-10-14 12:54:13',2,0.036037,0,'Action completed, no processing required'),
(637,46,0,'2026-10-14 12:55:13',0,0,0,'Run mode: CLI'),
(638,46,637,'2026-10-14 12:55:13',2,0.018379,0,'Action completed, no processing required'),
(639,46,0,'2026-10-14 12:56:13',0,0,0,'Run mode: CLI'),
(640,46,639,'2026-10-14 12:56:13',2,0.0190289,0,'Action completed, no processing required'),
(641,46,0,'2026-10-14 12:57:13',0,0,0,'Run mode: CLI'),
(642,46,641,'2026-10-14 12:57:13',2,0.020355,0,'Action completed, no processing required'),
(643,46,0,'2026-10-14 12:58:14',0,0,0,'Run mode: CLI'),
(644,46,643,'2026-10-14 12:58:14',2,0.0281589,0,'Action completed, no processing required'),
(645,46,0,'2026-10-14 12:59:14',0,0,0,'Run mode: CLI'),
(646,46,645,'2026-10-14 12:59:14',2,0.0254791,0,'Action completed, no processing required'),
(647,46,0,'2026-10-14 13:00:14',0,0,0,'Run mode: CLI'),
(648,46,647,'2026-10-14 13:00:14',2,0.0252621,0,'Action completed, no processing required'),
(649,46,0,'2026-10-14 13:01:14',0,0,0,'Run mode: CLI'),
(650,46,649,'2026-10-14 13:01:14',2,0.020062,0,'Action completed, no processing required'),
(651,42,0,'2026-10-14 13:02:15',0,0,0,'Run mode: CLI'),
(652,42,651,'2026-10-14 13:02:15',2,0.0563011,0,'Action completed, fully processed'),
(653,46,0,'2026-10-14 13:02:15',0,0,0,'Run mode: CLI'),
(654,46,653,'2026-10-14 13:02:15',2,0.00718307,0,'Action completed, no processing required'),
(655,46,0,'2026-10-14 13:03:15',0,0,0,'Run mode: CLI'),
(656,46,655,'2026-10-14 13:03:15',2,0.0235679,0,'Action completed, no processing required'),
(657,46,0,'2026-10-14 13:04:15',0,0,0,'Run mode: CLI'),
(658,46,657,'2026-10-14 13:04:15',2,0.0237029,0,'Action completed, no processing required'),
(659,46,0,'2026-10-14 13:05:16',0,0,0,'Run mode: CLI'),
(660,46,659,'2026-10-14 13:05:16',2,0.029994,0,'Action completed, no processing required'),
(661,46,0,'2026-10-14 13:06:16',0,0,0,'Run mode: CLI'),
(662,46,661,'2026-10-14 13:06:16',2,0.020648,0,'Action completed, no processing required'),
(663,46,0,'2026-10-14 13:07:16',0,0,0,'Run mode: CLI'),
(664,46,663,'2026-10-14 13:07:16',2,0.020838,0,'Action completed, no processing required'),
(665,46,0,'2026-10-14 13:08:16',0,0,0,'Run mode: CLI'),
(666,46,665,'2026-10-14 13:08:16',2,0.0337319,0,'Action completed, no processing required'),
(667,46,0,'2026-10-14 13:09:17',0,0,0,'Run mode: CLI'),
(668,46,667,'2026-10-14 13:09:17',2,0.020076,0,'Action completed, no processing required'),
(669,46,0,'2026-10-14 13:10:17',0,0,0,'Run mode: CLI'),
(670,46,669,'2026-10-14 13:10:17',2,0.0252459,0,'Action completed, no processing required'),
(671,46,0,'2026-10-14 13:11:17',0,0,0,'Run mode: CLI'),
(672,46,671,'2026-10-14 13:11:17',2,0.027518,0,'Action completed, no processing required'),
(673,46,0,'2026-10-14 13:12:17',0,0,0,'Run mode: CLI'),
(674,46,673,'2026-10-14 13:12:17',2,0.0194821,0,'Action completed, no processing required'),
(675,46,0,'2026-10-14 13:13:18',0,0,0,'Run mode: CLI'),
(676,46,675,'2026-10-14 13:13:18',2,0.019495,0,'Action completed, no processing required'),
(677,46,0,'2026-10-14 13:14:18',0,0,0,'Run mode: CLI'),
(678,46,677,'2026-10-14 13:14:18',2,0.019635,0,'Action completed, no processing required'),
(679,46,0,'2026-10-14 13:15:18',0,0,0,'Run mode: CLI'),
(680,46,679,'2026-10-14 13:15:18',2,0.0176349,0,'Action completed, no processing required'),
(681,46,0,'2026-10-14 13:16:18',0,0,0,'Run mode: CLI'),
(682,46,681,'2026-10-14 13:16:18',2,0.0762601,0,'Action completed, no processing required'),
(683,46,0,'2026-10-14 13:17:19',0,0,0,'Run mode: CLI'),
(684,46,683,'2026-10-14 13:17:19',2,0.019115,0,'Action completed, no processing required'),
(685,46,0,'2026-10-14 13:18:19',0,0,0,'Run mode: CLI'),
(686,46,685,'2026-10-14 13:18:19',2,0.0222549,0,'Action completed, no processing required'),
(687,46,0,'2026-10-14 13:19:19',0,0,0,'Run mode: CLI'),
(688,46,687,'2026-10-14 13:19:19',2,0.026356,0,'Action completed, no processing required'),
(689,46,0,'2026-10-14 13:20:19',0,0,0,'Run mode: CLI'),
(690,46,689,'2026-10-14 13:20:19',2,0.021847,0,'Action completed, no processing required'),
(691,46,0,'2026-10-14 13:21:20',0,0,0,'Run mode: CLI'),
(692,46,691,'2026-10-14 13:21:20',2,0.018986,0,'Action completed, no processing required'),
(693,46,0,'2026-10-14 13:22:20',0,0,0,'Run mode: CLI'),
(694,46,693,'2026-10-14 13:22:20',2,0.0193059,0,'Action completed, no processing required'),
(695,46,0,'2026-10-14 13:23:20',0,0,0,'Run mode: CLI'),
(696,46,695,'2026-10-14 13:23:20',2,0.020793,0,'Action completed, no processing required'),
(697,46,0,'2026-10-14 13:24:20',0,0,0,'Run mode: CLI'),
(698,46,697,'2026-10-14 13:24:20',2,0.023757,0,'Action completed, no processing required'),
(699,46,0,'2026-10-14 13:25:20',0,0,0,'Run mode: CLI'),
(700,46,699,'2026-10-14 13:25:20',2,0.019707,0,'Action completed, no processing required'),
(701,46,0,'2026-10-14 13:26:21',0,0,0,'Run mode: CLI'),
(702,46,701,'2026-10-14 13:26:21',2,0.019078,0,'Action completed, no processing required'),
(703,46,0,'2026-10-14 13:27:21',0,0,0,'Run mode: CLI'),
(704,46,703,'2026-10-14 13:27:21',2,0.024518,0,'Action completed, no processing required'),
(705,46,0,'2026-10-14 13:28:21',0,0,0,'Run mode: CLI'),
(706,46,705,'2026-10-14 13:28:21',2,0.0177131,0,'Action completed, no processing required'),
(707,46,0,'2026-10-14 13:29:21',0,0,0,'Run mode: CLI'),
(708,46,707,'2026-10-14 13:29:21',2,0.0177531,0,'Action completed, no processing required'),
(709,46,0,'2026-10-14 13:30:22',0,0,0,'Run mode: CLI'),
(710,46,709,'2026-10-14 13:30:22',2,0.0215709,0,'Action completed, no processing required'),
(711,46,0,'2026-10-14 13:31:22',0,0,0,'Run mode: CLI'),
(712,46,711,'2026-10-14 13:31:22',2,0.0271971,0,'Action completed, no processing required'),
(713,42,0,'2026-10-14 13:32:22',0,0,0,'Run mode: CLI'),
(714,42,713,'2026-10-14 13:32:22',2,0.123154,0,'Action completed, fully processed'),
(715,46,0,'2026-10-14 13:32:22',0,0,0,'Run mode: CLI'),
(716,46,715,'2026-10-14 13:32:22',2,0.0204031,0,'Action completed, no processing required'),
(717,46,0,'2026-10-14 13:33:22',0,0,0,'Run mode: CLI'),
(718,46,717,'2026-10-14 13:33:22',2,0.0212612,0,'Action completed, no processing required'),
(719,46,0,'2026-10-14 13:34:23',0,0,0,'Run mode: CLI'),
(720,46,719,'2026-10-14 13:34:23',2,0.02039,0,'Action completed, no processing required'),
(721,46,0,'2026-10-14 13:35:23',0,0,0,'Run mode: CLI'),
(722,46,721,'2026-10-14 13:35:23',2,0.0210772,0,'Action completed, no processing required'),
(723,46,0,'2026-10-14 13:36:23',0,0,0,'Run mode: CLI'),
(724,46,723,'2026-10-14 13:36:23',2,0.0225799,0,'Action completed, no processing required'),
(725,46,0,'2026-10-14 13:37:23',0,0,0,'Run mode: CLI'),
(726,46,725,'2026-10-14 13:37:23',2,0.0194311,0,'Action completed, no processing required'),
(727,46,0,'2026-10-14 13:38:24',0,0,0,'Run mode: CLI'),
(728,46,727,'2026-10-14 13:38:24',2,0.0196471,0,'Action completed, no processing required'),
(729,46,0,'2026-10-14 13:39:24',0,0,0,'Run mode: CLI'),
(730,46,729,'2026-10-14 13:39:24',2,0.0198989,0,'Action completed, no processing required'),
(731,46,0,'2026-10-14 13:40:24',0,0,0,'Run mode: CLI'),
(732,46,731,'2026-10-14 13:40:24',2,0.0260859,0,'Action completed, no processing required'),
(733,46,0,'2026-10-14 13:41:24',0,0,0,'Run mode: CLI'),
(734,46,733,'2026-10-14 13:41:24',2,0.022337,0,'Action completed, no processing required'),
(735,46,0,'2026-10-14 13:42:24',0,0,0,'Run mode: CLI'),
(736,46,735,'2026-10-14 13:42:24',2,0.0208399,0,'Action completed, no processing required'),
(737,46,0,'2026-10-14 13:43:25',0,0,0,'Run mode: CLI'),
(738,46,737,'2026-10-14 13:43:25',2,0.019232,0,'Action completed, no processing required'),
(739,46,0,'2026-10-14 13:44:25',0,0,0,'Run mode: CLI'),
(740,46,739,'2026-10-14 13:44:25',2,0.0312679,0,'Action completed, no processing required'),
(741,46,0,'2026-10-14 13:45:25',0,0,0,'Run mode: CLI'),
(742,46,741,'2026-10-14 13:45:25',2,0.024754,0,'Action completed, no processing required'),
(743,46,0,'2026-10-14 13:46:25',0,0,0,'Run mode: CLI'),
(744,46,743,'2026-10-14 13:46:25',2,0.0250361,0,'Action completed, no processing required'),
(745,46,0,'2026-10-14 13:47:25',0,0,0,'Run mode: CLI'),
(746,46,745,'2026-10-14 13:47:25',2,0.0199139,0,'Action completed, no processing required'),
(747,46,0,'2026-10-14 13:48:26',0,0,0,'Run mode: CLI'),
(748,46,747,'2026-10-14 13:48:26',2,0.0210869,0,'Action completed, no processing required'),
(749,46,0,'2026-10-14 13:49:26',0,0,0,'Run mode: CLI'),
(750,46,749,'2026-10-14 13:49:26',2,0.0221419,0,'Action completed, no processing required'),
(751,46,0,'2026-10-14 13:50:26',0,0,0,'Run mode: CLI'),
(752,46,751,'2026-10-14 13:50:26',2,0.0203331,0,'Action completed, no processing required'),
(753,46,0,'2026-10-14 13:51:26',0,0,0,'Run mode: CLI'),
(754,46,753,'2026-10-14 13:51:26',2,0.0213931,0,'Action completed, no processing required'),
(755,46,0,'2026-10-14 13:52:27',0,0,0,'Run mode: CLI'),
(756,46,755,'2026-10-14 13:52:27',2,0.0228031,0,'Action completed, no processing required'),
(757,46,0,'2026-10-14 13:53:27',0,0,0,'Run mode: CLI'),
(758,46,757,'2026-10-14 13:53:27',2,0.021487,0,'Action completed, no processing required'),
(759,46,0,'2026-10-14 13:54:27',0,0,0,'Run mode: CLI'),
(760,46,759,'2026-10-14 13:54:27',2,0.0268319,0,'Action completed, no processing required'),
(761,46,0,'2026-10-14 13:55:27',0,0,0,'Run mode: CLI'),
(762,46,761,'2026-10-14 13:55:27',2,0.021771,0,'Action completed, no processing required'),
(763,46,0,'2026-10-14 13:56:28',0,0,0,'Run mode: CLI'),
(764,46,763,'2026-10-14 13:56:28',2,0.023248,0,'Action completed, no processing required'),
(765,46,0,'2026-10-14 13:57:28',0,0,0,'Run mode: CLI'),
(766,46,765,'2026-10-14 13:57:28',2,0.0183711,0,'Action completed, no processing required'),
(767,46,0,'2026-10-14 13:58:28',0,0,0,'Run mode: CLI'),
(768,46,767,'2026-10-14 13:58:28',2,0.02156,0,'Action completed, no processing required'),
(769,46,0,'2026-10-14 13:59:28',0,0,0,'Run mode: CLI'),
(770,46,769,'2026-10-14 13:59:28',2,0.0214322,0,'Action completed, no processing required'),
(771,46,0,'2026-10-14 14:00:28',0,0,0,'Run mode: CLI'),
(772,46,771,'2026-10-14 14:00:28',2,0.0194511,0,'Action completed, no processing required'),
(773,46,0,'2026-10-14 14:01:29',0,0,0,'Run mode: CLI'),
(774,46,773,'2026-10-14 14:01:29',2,0.030021,0,'Action completed, no processing required'),
(775,42,0,'2026-10-14 14:02:29',0,0,0,'Run mode: CLI'),
(776,42,775,'2026-10-14 14:02:29',2,0.0840509,0,'Action completed, fully processed'),
(777,46,0,'2026-10-14 14:02:29',0,0,0,'Run mode: CLI'),
(778,46,777,'2026-10-14 14:02:29',2,0.010082,0,'Action completed, no processing required'),
(779,46,0,'2026-10-14 14:03:29',0,0,0,'Run mode: CLI'),
(780,46,779,'2026-10-14 14:03:29',2,0.0190911,0,'Action completed, no processing required'),
(781,46,0,'2026-10-14 14:04:29',0,0,0,'Run mode: CLI'),
(782,46,781,'2026-10-14 14:04:29',2,0.030093,0,'Action completed, no processing required'),
(783,46,0,'2026-10-14 14:05:30',0,0,0,'Run mode: CLI'),
(784,46,783,'2026-10-14 14:05:30',2,0.020628,0,'Action completed, no processing required'),
(785,46,0,'2026-10-14 14:06:30',0,0,0,'Run mode: CLI'),
(786,46,785,'2026-10-14 14:06:30',2,0.0216429,0,'Action completed, no processing required'),
(787,46,0,'2026-10-14 14:07:30',0,0,0,'Run mode: CLI'),
(788,46,787,'2026-10-14 14:07:30',2,0.0241811,0,'Action completed, no processing required'),
(789,46,0,'2026-10-14 14:08:30',0,0,0,'Run mode: CLI'),
(790,46,789,'2026-10-14 14:08:30',2,0.0215151,0,'Action completed, no processing required'),
(791,46,0,'2026-10-14 14:09:31',0,0,0,'Run mode: CLI'),
(792,46,791,'2026-10-14 14:09:31',2,0.0284839,0,'Action completed, no processing required'),
(793,46,0,'2026-10-14 14:10:31',0,0,0,'Run mode: CLI'),
(794,46,793,'2026-10-14 14:10:31',2,0.0188549,0,'Action completed, no processing required'),
(795,46,0,'2026-10-14 14:11:31',0,0,0,'Run mode: CLI'),
(796,46,795,'2026-10-14 14:11:31',2,0.017839,0,'Action completed, no processing required'),
(797,46,0,'2026-10-14 14:12:31',0,0,0,'Run mode: CLI'),
(798,46,797,'2026-10-14 14:12:31',2,0.0219159,0,'Action completed, no processing required'),
(799,46,0,'2026-10-14 14:13:31',0,0,0,'Run mode: CLI'),
(800,46,799,'2026-10-14 14:13:31',2,0.022181,0,'Action completed, no processing required'),
(801,46,0,'2026-10-14 14:14:32',0,0,0,'Run mode: CLI'),
(802,46,801,'2026-10-14 14:14:32',2,0.01666,0,'Action completed, no processing required'),
(803,46,0,'2026-10-14 14:15:32',0,0,0,'Run mode: CLI'),
(804,46,803,'2026-10-14 14:15:32',2,0.018486,0,'Action completed, no processing required'),
(805,46,0,'2026-10-14 14:16:32',0,0,0,'Run mode: CLI'),
(806,46,805,'2026-10-14 14:16:32',2,0.0231049,0,'Action completed, no processing required'),
(807,46,0,'2026-10-14 14:17:32',0,0,0,'Run mode: CLI'),
(808,46,807,'2026-10-14 14:17:32',2,0.0341289,0,'Action completed, no processing required'),
(809,46,0,'2026-10-14 14:18:33',0,0,0,'Run mode: CLI'),
(810,46,809,'2026-10-14 14:18:33',2,0.0174971,0,'Action completed, no processing required'),
(811,46,0,'2026-10-14 14:19:33',0,0,0,'Run mode: CLI'),
(812,46,811,'2026-10-14 14:19:33',2,0.0221109,0,'Action completed, no processing required'),
(813,46,0,'2026-10-14 14:20:33',0,0,0,'Run mode: CLI'),
(814,46,813,'2026-10-14 14:20:33',2,0.0207341,0,'Action completed, no processing required'),
(815,46,0,'2026-10-14 14:21:33',0,0,0,'Run mode: CLI'),
(816,46,815,'2026-10-14 14:21:33',2,0.022635,0,'Action completed, no processing required'),
(817,46,0,'2026-10-14 14:22:33',0,0,0,'Run mode: CLI'),
(818,46,817,'2026-10-14 14:22:33',2,0.0219829,0,'Action completed, no processing required'),
(819,46,0,'2026-10-14 14:23:34',0,0,0,'Run mode: CLI'),
(820,46,819,'2026-10-14 14:23:34',2,0.0233541,0,'Action completed, no processing required'),
(821,46,0,'2026-10-14 14:24:34',0,0,0,'Run mode: CLI'),
(822,46,821,'2026-10-14 14:24:34',2,0.028105,0,'Action completed, no processing required'),
(823,46,0,'2026-10-14 14:25:34',0,0,0,'Run mode: CLI'),
(824,46,823,'2026-10-14 14:25:34',2,0.019129,0,'Action completed, no processing required'),
(825,46,0,'2026-10-14 14:26:34',0,0,0,'Run mode: CLI'),
(826,46,825,'2026-10-14 14:26:34',2,0.01894,0,'Action completed, no processing required'),
(827,46,0,'2026-10-14 14:27:34',0,0,0,'Run mode: CLI'),
(828,46,827,'2026-10-14 14:27:34',2,0.022831,0,'Action completed, no processing required'),
(829,46,0,'2026-10-14 14:28:35',0,0,0,'Run mode: CLI'),
(830,46,829,'2026-10-14 14:28:35',2,0.022002,0,'Action completed, no processing required'),
(831,46,0,'2026-10-14 14:29:35',0,0,0,'Run mode: CLI'),
(832,46,831,'2026-10-14 14:29:35',2,0.0248408,0,'Action completed, no processing required'),
(833,46,0,'2026-10-14 14:30:35',0,0,0,'Run mode: CLI'),
(834,46,833,'2026-10-14 14:30:35',2,0.027405,0,'Action completed, no processing required'),
(835,46,0,'2026-10-14 14:31:36',0,0,0,'Run mode: CLI'),
(836,46,835,'2026-10-14 14:31:36',2,0.0211501,0,'Action completed, no processing required'),
(837,42,0,'2026-10-14 14:32:36',0,0,0,'Run mode: CLI'),
(838,42,837,'2026-10-14 14:32:36',2,0.0505691,0,'Action completed, fully processed'),
(839,46,0,'2026-10-14 14:32:36',0,0,0,'Run mode: CLI'),
(840,46,839,'2026-10-14 14:32:36',2,0.00710011,0,'Action completed, no processing required'),
(841,46,0,'2026-10-14 14:33:36',0,0,0,'Run mode: CLI'),
(842,46,841,'2026-10-14 14:33:36',2,0.0222929,0,'Action completed, no processing required'),
(843,46,0,'2026-10-14 14:34:36',0,0,0,'Run mode: CLI'),
(844,46,843,'2026-10-14 14:34:36',2,0.020653,0,'Action completed, no processing required'),
(845,46,0,'2026-10-14 14:35:36',0,0,0,'Run mode: CLI'),
(846,46,845,'2026-10-14 14:35:36',2,0.0184951,0,'Action completed, no processing required'),
(847,46,0,'2026-10-14 14:36:37',0,0,0,'Run mode: CLI'),
(848,46,847,'2026-10-14 14:36:37',2,0.026315,0,'Action completed, no processing required'),
(849,46,0,'2026-10-14 14:37:37',0,0,0,'Run mode: CLI'),
(850,46,849,'2026-10-14 14:37:37',2,0.0239818,0,'Action completed, no processing required'),
(851,46,0,'2026-10-14 14:38:37',0,0,0,'Run mode: CLI'),
(852,46,851,'2026-10-14 14:38:37',2,0.0196569,0,'Action completed, no processing required'),
(853,46,0,'2026-10-14 14:39:37',0,0,0,'Run mode: CLI'),
(854,46,853,'2026-10-14 14:39:37',2,0.021874,0,'Action completed, no processing required'),
(855,46,0,'2026-10-14 14:40:38',0,0,0,'Run mode: CLI'),
(856,46,855,'2026-10-14 14:40:38',2,0.0207851,0,'Action completed, no processing required');
/*!40000 ALTER TABLE `glpi_crontasklogs` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_crontasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_crontasks` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `itemtype` varchar(100) NOT NULL,
  `name` varchar(150) NOT NULL,
  `frequency` int(11) NOT NULL,
  `param` int(11) DEFAULT NULL,
  `state` int(11) NOT NULL DEFAULT 1,
  `mode` int(11) NOT NULL DEFAULT 1,
  `allowmode` int(11) NOT NULL DEFAULT 3,
  `hourmin` int(11) NOT NULL DEFAULT 0,
  `hourmax` int(11) NOT NULL DEFAULT 24,
  `logs_lifetime` int(11) NOT NULL DEFAULT 30,
  `lastrun` timestamp NULL DEFAULT NULL,
  `lastcode` int(11) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`itemtype`,`name`),
  KEY `name` (`name`),
  KEY `mode` (`mode`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC COMMENT='Task run by internal / external cron.';
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_crontasks` DISABLE KEYS */;
INSERT INTO `glpi_crontasks` VALUES
(2,'CartridgeItem','cartridge',86400,10,0,1,3,0,24,30,NULL,NULL,NULL,NULL,NULL),
(3,'ConsumableItem','consumable',86400,10,0,1,3,0,24,30,NULL,NULL,NULL,NULL,NULL),
(4,'SoftwareLicense','software',86400,NULL,0,1,3,0,24,30,NULL,NULL,NULL,NULL,NULL),
(5,'Contract','contract',86400,NULL,1,1,3,0,24,30,'2026-10-13 17:03:00',NULL,NULL,NULL,NULL),
(6,'Infocom','infocom',86400,NULL,1,1,3,0,24,30,'2026-10-13 17:11:00',NULL,NULL,NULL,NULL),
(7,'CronTask','logs',86400,30,0,1,3,0,6,30,NULL,NULL,NULL,NULL,NULL),
(9,'MailCollector','mailgate',600,10,1,1,3,0,24,30,'2026-10-13 17:20:00',NULL,NULL,NULL,NULL),
(10,'DBconnection','checkdbreplicate',300,NULL,0,1,3,0,24,30,NULL,NULL,NULL,NULL,NULL),
(11,'CronTask','checkupdate',604800,NULL,0,1,3,0,24,30,NULL,NULL,NULL,NULL,NULL),
(12,'CronTask','session',86400,NULL,1,1,3,0,24,30,'2026-10-13 17:29:00',NULL,NULL,NULL,NULL),
(13,'CronTask','graph',3600,NULL,1,1,3,0,24,30,'2026-10-13 17:34:00',NULL,NULL,NULL,NULL),
(14,'ReservationItem','reservation',3600,NULL,1,1,3,0,24,30,'2026-10-13 17:42:00',NULL,NULL,NULL,NULL),
(15,'Ticket','closeticket',43200,NULL,1,1,3,0,24,30,'2026-10-13 19:21:00',NULL,NULL,NULL,NULL),
(16,'Ticket','alertnotclosed',43200,NULL,1,1,3,0,24,30,NULL,NULL,NULL,NULL,NULL),
(17,'SlaLevel_Ticket','slaticket',300,NULL,1,1,3,0,24,30,NULL,NULL,NULL,NULL,NULL),
(18,'Ticket','createinquestticket',86400,NULL,1,1,3,0,24,30,NULL,NULL,NULL,NULL,NULL),
(19,'CronTask','watcher',86400,NULL,1,1,3,0,24,30,NULL,NULL,NULL,NULL,NULL),
(20,'CommonITILRecurrentCron','RecurrentItems',3600,NULL,1,1,3,0,24,30,NULL,NULL,NULL,NULL,NULL),
(21,'PlanningRecall','planningrecall',300,NULL,1,1,3,0,24,30,NULL,NULL,NULL,NULL,NULL),
(22,'QueuedNotification','queuednotification',60,50,1,1,3,0,24,30,NULL,NULL,NULL,NULL,NULL),
(23,'QueuedNotification','queuednotificationclean',86400,30,1,1,3,0,6,30,NULL,NULL,NULL,NULL,NULL),
(24,'CronTask','temp',3600,NULL,1,1,3,0,24,30,NULL,NULL,NULL,NULL,NULL),
(25,'MailCollector','mailgateerror',86400,NULL,1,1,3,0,24,30,NULL,NULL,NULL,NULL,NULL),
(26,'CronTask','circularlogs',86400,4,0,1,3,0,6,30,NULL,NULL,NULL,NULL,NULL),
(27,'ObjectLock','unlockobject',3600,4,0,1,3,0,24,30,NULL,NULL,NULL,NULL,NULL),
(28,'SavedSearch','countAll',604800,NULL,0,1,3,0,24,30,NULL,NULL,NULL,NULL,NULL),
(29,'SavedSearch_Alert','savedsearchesalerts',86400,NULL,0,1,3,0,24,30,NULL,NULL,NULL,NULL,NULL),
(30,'Telemetry','telemetry',2592000,NULL,0,1,3,0,6,30,NULL,NULL,NULL,NULL,NULL),
(31,'Certificate','certificate',86400,NULL,1,1,3,0,24,30,NULL,NULL,NULL,NULL,NULL),
(32,'OlaLevel_Ticket','olaticket',300,NULL,1,1,3,0,24,30,NULL,NULL,NULL,NULL,NULL),
(33,'PurgeLogs','PurgeLogs',86400,24,1,2,3,0,6,30,NULL,NULL,NULL,NULL,NULL),
(34,'Ticket','purgeticket',86400,NULL,0,2,3,0,6,30,NULL,NULL,NULL,NULL,NULL),
(35,'Document','cleanorphansdocument',86400,NULL,0,2,3,0,6,30,NULL,NULL,NULL,NULL,NULL),
(36,'User','passwordexpiration',86400,100,0,2,3,0,24,30,NULL,NULL,NULL,NULL,NULL),
(37,'Glpi\\Marketplace\\Controller','checkAllUpdates',86400,NULL,1,2,3,0,6,30,NULL,NULL,NULL,NULL,NULL),
(38,'CleanSoftwareCron','cleansoftware',2592000,1000,0,2,3,0,6,300,NULL,NULL,NULL,NULL,NULL),
(39,'Domain','DomainsAlert',86400,NULL,1,2,3,0,24,30,'2026-10-13 17:03:00',NULL,NULL,NULL,NULL),
(40,'Glpi\\Inventory\\Inventory','cleantemp',86400,NULL,0,2,3,0,6,30,NULL,NULL,NULL,NULL,NULL),
(41,'Glpi\\Inventory\\Inventory','cleanorphansinventory',86400,NULL,1,2,3,0,6,30,NULL,NULL,NULL,NULL,NULL),
(42,'PendingReasonCron','pendingreason_autobump_autosolve',1800,NULL,1,2,3,0,24,60,'2026-10-14 14:32:00',NULL,NULL,NULL,NULL),
(43,'Agent','Cleanoldagents',86400,NULL,1,2,3,0,6,30,NULL,NULL,NULL,NULL,NULL),
(44,'Change','createinquestchange',86400,NULL,1,2,3,0,24,30,'2026-10-13 17:03:00',NULL,NULL,NULL,NULL),
(45,'QueuedNotification','queuednotificationcleanstaleajax',86400,NULL,0,2,3,0,6,30,NULL,NULL,NULL,NULL,NULL),
(46,'QueuedWebhook','queuedwebhook',60,50,1,2,3,0,24,30,'2026-10-14 14:40:00',NULL,NULL,NULL,NULL),
(47,'QueuedWebhook','queuedwebhookclean',86400,30,1,2,3,0,6,30,NULL,NULL,NULL,NULL,NULL),
(48,'Glpi\\Form\\Form','purgedraftforms',86400,7,1,2,3,0,24,30,'2026-10-13 17:03:00',NULL,NULL,NULL,NULL),
(49,'Software','purgesoftware',2592000,1000,0,2,3,0,6,300,NULL,NULL,NULL,NULL,NULL),
(50,'CommonITILValidationCron','approvalreminder',604800,NULL,0,2,3,0,24,30,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `glpi_crontasks` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_dashboards_dashboards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_dashboards_dashboards` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `key` varchar(100) NOT NULL,
  `name` varchar(100) NOT NULL,
  `context` varchar(100) NOT NULL DEFAULT 'core',
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`),
  KEY `name` (`name`),
  KEY `users_id` (`users_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_dashboards_dashboards` DISABLE KEYS */;
INSERT INTO `glpi_dashboards_dashboards` VALUES
(1,'central','Central','core',0),
(2,'assets','Activos','core',0),
(3,'assistance','Soporte','core',0),
(4,'mini_tickets','Panel de control de mini peticiones','mini_core',0);
/*!40000 ALTER TABLE `glpi_dashboards_dashboards` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_dashboards_filters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_dashboards_filters` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `dashboards_dashboards_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `filter` longtext DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `dashboards_dashboards_id` (`dashboards_dashboards_id`),
  KEY `users_id` (`users_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_dashboards_filters` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_dashboards_filters` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_dashboards_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_dashboards_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `dashboards_dashboards_id` int(10) unsigned NOT NULL,
  `gridstack_id` varchar(255) NOT NULL,
  `card_id` varchar(255) NOT NULL,
  `x` int(11) DEFAULT NULL,
  `y` int(11) DEFAULT NULL,
  `width` int(11) DEFAULT NULL,
  `height` int(11) DEFAULT NULL,
  `card_options` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `dashboards_dashboards_id` (`dashboards_dashboards_id`)
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_dashboards_items` DISABLE KEYS */;
INSERT INTO `glpi_dashboards_items` VALUES
(1,1,'bn_count_Computer_4a315743-151c-40cb-a20b-762250668dac','bn_count_Computer',3,0,3,2,'{\"color\":\"#e69393\",\"widgettype\":\"bigNumber\",\"use_gradient\":\"0\",\"limit\":\"7\"}'),
(2,1,'bn_count_Software_0690f524-e826-47a9-b50a-906451196b83','bn_count_Software',0,0,3,2,'{\"color\":\"#aaddac\",\"widgettype\":\"bigNumber\",\"use_gradient\":\"0\",\"limit\":\"7\"}'),
(3,1,'bn_count_Rack_c6502e0a-5991-46b4-a771-7f355137306b','bn_count_Rack',6,2,3,2,'{\"color\":\"#0e87a0\",\"widgettype\":\"bigNumber\",\"use_gradient\":\"0\",\"limit\":\"7\"}'),
(4,1,'bn_count_SoftwareLicense_e755fd06-283e-4479-ba35-2d548f8f8a90','bn_count_SoftwareLicense',0,2,3,2,'{\"color\":\"#27ab3c\",\"widgettype\":\"bigNumber\",\"use_gradient\":\"0\",\"limit\":\"7\"}'),
(5,1,'bn_count_Monitor_7059b94c-583c-4ba7-b100-d40461165318','bn_count_Monitor',3,2,3,2,'{\"color\":\"#b52d30\",\"widgettype\":\"bigNumber\",\"use_gradient\":\"0\",\"limit\":\"7\"}'),
(6,1,'bn_count_Ticket_a74c0903-3387-4a07-9111-b0938af8f1e7','bn_count_Ticket',14,7,3,2,'{\"color\":\"#ffdc64\",\"widgettype\":\"bigNumber\",\"use_gradient\":\"0\",\"limit\":\"7\"}'),
(7,1,'bn_count_Problem_c1cf5cfb-f626-472e-82a1-49c3e200e746','bn_count_Problem',20,7,3,2,'{\"color\":\"#f08d7b\",\"widgettype\":\"bigNumber\",\"use_gradient\":\"0\",\"limit\":\"7\"}'),
(8,1,'count_Computer_Manufacturer_6129c451-42b5-489d-b693-c362adf32d49','count_Computer_Manufacturer',0,4,5,4,'{\"color\":\"#f8faf9\",\"widgettype\":\"donut\",\"use_gradient\":\"1\",\"limit\":\"5\"}'),
(9,1,'top_ticket_user_requester_c74f52a8-046a-4077-b1a6-c9f840d34b82','top_ticket_user_requester',14,9,6,5,'{\"color\":\"#f9fafb\",\"widgettype\":\"hbar\",\"use_gradient\":\"1\",\"limit\":\"5\"}'),
(10,1,'bn_count_tickets_late_04c47208-d7e5-4aca-9566-d46e68c45c67','bn_count_tickets_late',17,7,3,2,'{\"color\":\"#f8911f\",\"widgettype\":\"bigNumber\",\"use_gradient\":\"0\",\"limit\":\"7\"}'),
(11,1,'ticket_status_2e4e968b-d4e6-4e33-9ce9-a1aaff53dfde','ticket_status',14,0,12,7,'{\"color\":\"#fafafa\",\"widgettype\":\"stackedbars\",\"use_gradient\":\"0\",\"limit\":\"12\"}'),
(12,1,'top_ticket_ITILCategory_37736ba9-d429-4cb3-9058-ef4d111d9269','top_ticket_ITILCategory',20,9,6,5,'{\"color\":\"#fbf9f9\",\"widgettype\":\"hbar\",\"use_gradient\":\"1\",\"limit\":\"5\"}'),
(13,1,'bn_count_Printer_517684b0-b064-49dd-943e-fcb6f915e453','bn_count_Printer',9,2,3,2,'{\"color\":\"#365a8f\",\"widgettype\":\"bigNumber\",\"use_gradient\":\"0\",\"limit\":\"7\"}'),
(14,1,'bn_count_Phone_f70c489f-02c1-46e5-978b-94a95b5038ee','bn_count_Phone',9,0,3,2,'{\"color\":\"#d5e1ec\",\"widgettype\":\"bigNumber\",\"use_gradient\":\"0\",\"limit\":\"7\"}'),
(15,1,'bn_count_Change_ab950dbd-cd25-466d-8dff-7dcaca386564','bn_count_Change',23,7,3,2,'{\"color\":\"#cae3c4\",\"widgettype\":\"bigNumber\",\"use_gradient\":\"0\",\"limit\":\"7\"}'),
(16,1,'bn_count_Group_b84a93f2-a26c-49d7-82a4-5446697cc5b0','bn_count_Group',4,8,4,2,'{\"color\":\"#e0e0e0\",\"widgettype\":\"bigNumber\",\"use_gradient\":\"0\",\"limit\":\"7\"}'),
(17,1,'bn_count_Profile_770b35e8-68e9-4b4f-9e09-5a11058f069f','bn_count_Profile',4,10,4,2,'{\"color\":\"#e0e0e0\",\"widgettype\":\"bigNumber\",\"use_gradient\":\"0\",\"limit\":\"7\"}'),
(18,1,'bn_count_Supplier_36ff9011-e4cf-4d89-b9ab-346b9857d734','bn_count_Supplier',8,8,3,2,'{\"color\":\"#c9c9c9\",\"widgettype\":\"bigNumber\",\"use_gradient\":\"0\",\"limit\":\"7\"}'),
(19,1,'bn_count_KnowbaseItem_a3785a56-bed4-4a30-8387-f251f5365b3b','bn_count_KnowbaseItem',8,10,3,2,'{\"color\":\"#c9c9c9\",\"widgettype\":\"bigNumber\",\"use_gradient\":\"0\",\"limit\":\"7\"}'),
(20,1,'bn_count_Entity_9b82951a-ba52-45cc-a2d3-1d238ec37adf','bn_count_Entity',0,10,4,2,'{\"color\":\"#f9f9f9\",\"widgettype\":\"bigNumber\",\"use_gradient\":\"0\",\"limit\":\"7\"}'),
(21,1,'bn_count_Document_7dc7f4b8-61ff-4147-b994-5541bddd7b66','bn_count_Document',11,8,3,2,'{\"color\":\"#b4b4b4\",\"widgettype\":\"bigNumber\",\"use_gradient\":\"0\",\"limit\":\"7\"}'),
(22,1,'bn_count_Project_4d412ee2-8b79-469b-995f-4c0a05ab849d','bn_count_Project',11,10,3,2,'{\"color\":\"#b3b3b3\",\"widgettype\":\"bigNumber\",\"use_gradient\":\"0\",\"limit\":\"7\"}'),
(23,1,'bn_count_NetworkEquipment_c537e334-d584-43bc-b6de-b4a939143e89','bn_count_NetworkEquipment',6,0,3,2,'{\"color\":\"#bfe7ea\",\"widgettype\":\"bigNumber\",\"use_gradient\":\"0\",\"limit\":\"7\"}'),
(24,1,'bn_count_User_ac0cbe52-3593-43c1-8ecc-0eb115de494d','bn_count_User',0,8,4,2,'{\"color\":\"#fafafa\",\"widgettype\":\"bigNumber\",\"use_gradient\":\"0\",\"limit\":\"7\"}'),
(25,1,'count_Monitor_MonitorModel_5a476ff9-116e-4270-858b-c003c20841a9','count_Monitor_MonitorModel',5,4,5,4,'{\"color\":\"#f5fafa\",\"widgettype\":\"donut\",\"use_gradient\":\"1\",\"limit\":\"5\"}'),
(26,1,'count_NetworkEquipment_State_81f2ae35-b366-4065-ac26-02ea4e3704a6','count_NetworkEquipment_State',10,4,4,4,'{\"color\":\"#f5f3ef\",\"widgettype\":\"donut\",\"use_gradient\":\"1\",\"limit\":\"5\"}'),
(27,2,'bn_count_Computer_34cfbaf9-a471-4852-b48c-0dadea7644de','bn_count_Computer',0,0,4,3,'{\"color\":\"#f3d0d0\",\"widgettype\":\"bigNumber\"}'),
(28,2,'bn_count_Software_60091467-2137-49f4-8834-f6602a482079','bn_count_Software',4,0,4,3,'{\"color\":\"#d1f1a8\",\"widgettype\":\"bigNumber\"}'),
(29,2,'bn_count_Printer_c9a385d4-76a3-4971-ad0e-1470efeafacc','bn_count_Printer',8,3,4,3,'{\"color\":\"#5da8d6\",\"widgettype\":\"bigNumber\"}'),
(30,2,'bn_count_PDU_60053eb6-8dda-4416-9a4b-afd51889bd09','bn_count_PDU',12,3,4,3,'{\"color\":\"#ffb62f\",\"widgettype\":\"bigNumber\"}'),
(31,2,'bn_count_Rack_0fdc196f-20d2-4f63-9ddb-b75c165cc664','bn_count_Rack',12,0,4,3,'{\"color\":\"#f7d79a\",\"widgettype\":\"bigNumber\"}'),
(32,2,'bn_count_Phone_c31fde2d-510a-4482-b17d-2f65b61eae08','bn_count_Phone',16,3,4,3,'{\"color\":\"#a0cec2\",\"widgettype\":\"bigNumber\"}'),
(33,2,'bn_count_Enclosure_c21ce30a-58c3-456a-81ec-3c5f01527a8f','bn_count_Enclosure',16,0,4,3,'{\"color\":\"#d7e8e4\",\"widgettype\":\"bigNumber\"}'),
(34,2,'bn_count_NetworkEquipment_76f1e239-777b-4552-b053-ae5c64190347','bn_count_NetworkEquipment',8,0,4,3,'{\"color\":\"#c8dae4\",\"widgettype\":\"bigNumber\"}'),
(35,2,'bn_count_SoftwareLicense_576e58fe-a386-480f-b405-1c2315b8ab47','bn_count_SoftwareLicense',4,3,4,3,'{\"color\":\"#9bc06b\",\"widgettype\":\"bigNumber\",\"use_gradient\":\"0\",\"limit\":\"7\"}'),
(36,2,'bn_count_Monitor_890e16d3-b121-48c6-9713-d9c239d9a970','bn_count_Monitor',0,3,4,3,'{\"color\":\"#dc6f6f\",\"widgettype\":\"bigNumber\",\"use_gradient\":\"0\",\"limit\":\"7\"}'),
(37,2,'count_Computer_Manufacturer_986e92e8-32e8-4a6f-806f-6f5383acbb3f','count_Computer_Manufacturer',4,6,4,4,'{\"color\":\"#f3f5f1\",\"widgettype\":\"hbar\",\"use_gradient\":\"1\",\"limit\":\"5\"}'),
(38,2,'count_Computer_State_290c5920-9eab-4db8-8753-46108e60f1d8','count_Computer_State',0,6,4,4,'{\"color\":\"#fbf7f7\",\"widgettype\":\"donut\",\"use_gradient\":\"1\",\"limit\":\"5\"}'),
(39,2,'count_Computer_ComputerType_c58f9c7e-22d5-478b-8226-d2a752bcbb09','count_Computer_ComputerType',8,6,4,4,'{\"color\":\"#f5f9fa\",\"widgettype\":\"donut\",\"use_gradient\":\"1\",\"limit\":\"5\"}'),
(40,2,'count_NetworkEquipment_Manufacturer_8132b21c-6f7f-4dc1-af54-bea794cb96e9','count_NetworkEquipment_Manufacturer',12,6,4,4,'{\"color\":\"#fcf8ed\",\"widgettype\":\"hbar\",\"use_gradient\":\"0\",\"limit\":\"5\"}'),
(41,2,'count_Monitor_Manufacturer_43b0c16b-af82-418e-aac1-f32b39705c0d','count_Monitor_Manufacturer',16,6,4,4,'{\"color\":\"#f9fbfb\",\"widgettype\":\"donut\",\"use_gradient\":\"1\",\"limit\":\"5\"}'),
(42,3,'bn_count_Ticket_344e761b-f7e8-4617-8c90-154b266b4d67','bn_count_Ticket',0,0,3,2,'{\"color\":\"#ffdc64\",\"widgettype\":\"bigNumber\",\"use_gradient\":\"0\",\"limit\":\"7\"}'),
(43,3,'bn_count_Problem_bdb4002b-a674-4493-820f-af85bed44d2a','bn_count_Problem',0,4,3,2,'{\"color\":\"#f0967b\",\"widgettype\":\"bigNumber\",\"use_gradient\":\"0\",\"limit\":\"7\"}'),
(44,3,'bn_count_Change_b9b87513-4f40-41e6-8621-f51f9a30fb19','bn_count_Change',0,6,3,2,'{\"color\":\"#cae3c4\",\"widgettype\":\"bigNumber\",\"use_gradient\":\"0\",\"limit\":\"7\"}'),
(45,3,'bn_count_tickets_late_1e9ae481-21b4-4463-a830-dec1b68ec5e7','bn_count_tickets_late',0,2,3,2,'{\"color\":\"#f8911f\",\"widgettype\":\"bigNumber\",\"use_gradient\":\"0\",\"limit\":\"7\"}'),
(46,3,'bn_count_tickets_incoming_336a36d9-67fe-4475-880e-447bd766b8fe','bn_count_tickets_incoming',3,6,3,2,'{\"color\":\"#a0e19d\",\"widgettype\":\"bigNumber\",\"use_gradient\":\"0\",\"limit\":\"7\"}'),
(47,3,'bn_count_tickets_closed_e004bab5-f2b6-4060-a401-a2a8b9885245','bn_count_tickets_closed',9,8,3,2,'{\"color\":\"#515151\",\"widgettype\":\"bigNumber\",\"use_gradient\":\"0\",\"limit\":\"7\"}'),
(48,3,'bn_count_tickets_assigned_7455c855-6df8-4514-a3d9-8b0fce52bd63','bn_count_tickets_assigned',6,6,3,2,'{\"color\":\"#eaf5f7\",\"widgettype\":\"bigNumber\",\"use_gradient\":\"0\",\"limit\":\"7\"}'),
(49,3,'bn_count_tickets_solved_5e9759b3-ee7e-4a14-b68f-1ac024ef55ee','bn_count_tickets_solved',9,6,3,2,'{\"color\":\"#d8d8d8\",\"widgettype\":\"bigNumber\",\"use_gradient\":\"0\",\"limit\":\"7\"}'),
(50,3,'bn_count_tickets_waiting_102b2c2a-6ac6-4d73-ba47-8b09382fe00e','bn_count_tickets_waiting',3,8,3,2,'{\"color\":\"#ffcb7d\",\"widgettype\":\"bigNumber\",\"use_gradient\":\"0\",\"limit\":\"7\"}'),
(51,3,'bn_count_TicketRecurrent_13f79539-61f6-45f7-8dde-045706e652f2','bn_count_TicketRecurrent',0,8,3,2,'{\"color\":\"#fafafa\",\"widgettype\":\"bigNumber\",\"use_gradient\":\"0\",\"limit\":\"7\"}'),
(52,3,'bn_count_tickets_planned_267bf627-9d5e-4b6c-b53d-b8623d793ccf','bn_count_tickets_planned',6,8,3,2,'{\"color\":\"#6298d5\",\"widgettype\":\"bigNumber\",\"use_gradient\":\"0\",\"limit\":\"7\"}'),
(53,3,'top_ticket_ITILCategory_0cba0c84-6c62-4cd8-8564-18614498d8e4','top_ticket_ITILCategory',12,6,4,4,'{\"color\":\"#f1f5ef\",\"widgettype\":\"donut\",\"use_gradient\":\"1\",\"limit\":\"7\"}'),
(54,3,'top_ticket_RequestType_b9e43f34-8e94-4a6e-9023-c5d1e2ce7859','top_ticket_RequestType',16,6,4,4,'{\"color\":\"#f9fafb\",\"widgettype\":\"hbar\",\"use_gradient\":\"1\",\"limit\":\"4\"}'),
(55,3,'top_ticket_Entity_a8e65812-519c-488e-9892-9adbe22fbd5c','top_ticket_Entity',20,6,4,4,'{\"color\":\"#f7f1f0\",\"widgettype\":\"donut\",\"use_gradient\":\"1\",\"limit\":\"7\"}'),
(56,3,'ticket_evolution_76fd4926-ee5e-48db-b6d6-e2947c190c5e','ticket_evolution',3,0,12,6,'{\"color\":\"#f3f7f8\",\"widgettype\":\"areas\",\"use_gradient\":\"0\",\"limit\":\"12\"}'),
(57,3,'ticket_status_5b256a35-b36b-4db5-ba11-ea7c125f126e','ticket_status',15,0,11,6,'{\"color\":\"#f7f3f2\",\"widgettype\":\"stackedbars\",\"use_gradient\":\"0\",\"limit\":\"12\"}'),
(58,4,'bn_count_tickets_closed_ccf7246b-645a-40d2-8206-fa33c769e3f5','bn_count_tickets_closed',24,0,4,2,'{\"color\":\"#fafafa\",\"widgettype\":\"bigNumber\",\"use_gradient\":\"0\",\"limit\":\"7\"}'),
(59,4,'bn_count_Ticket_d5bf3576-5033-40fb-bbdb-292294a7698e','bn_count_Ticket',0,0,4,2,'{\"color\":\"#ffd957\",\"widgettype\":\"bigNumber\",\"use_gradient\":\"0\",\"limit\":\"7\"}'),
(60,4,'bn_count_tickets_incoming_055e813c-b0ce-4687-91ef-559249e8ddd8','bn_count_tickets_incoming',4,0,4,2,'{\"color\":\"#6fd169\",\"widgettype\":\"bigNumber\",\"use_gradient\":\"0\",\"limit\":\"7\"}'),
(61,4,'bn_count_tickets_waiting_793c665b-b620-4b3a-a5a8-cf502defc008','bn_count_tickets_waiting',8,0,4,2,'{\"color\":\"#ffcb7d\",\"widgettype\":\"bigNumber\",\"use_gradient\":\"0\",\"limit\":\"7\"}'),
(62,4,'bn_count_tickets_assigned_d3d2f697-52b4-435e-9030-a760dd649085','bn_count_tickets_assigned',12,0,4,2,'{\"color\":\"#eaf4f7\",\"widgettype\":\"bigNumber\",\"use_gradient\":\"0\",\"limit\":\"7\"}'),
(63,4,'bn_count_tickets_planned_0c7f3569-c23b-4ee3-8e85-279229b23e70','bn_count_tickets_planned',16,0,4,2,'{\"color\":\"#6298d5\",\"widgettype\":\"bigNumber\",\"use_gradient\":\"0\",\"limit\":\"7\"}'),
(64,4,'bn_count_tickets_solved_ae2406cf-e8e8-410b-b355-46e3f5705ee8','bn_count_tickets_solved',20,0,4,2,'{\"color\":\"#d7d7d7\",\"widgettype\":\"bigNumber\",\"use_gradient\":\"0\",\"limit\":\"7\"}');
/*!40000 ALTER TABLE `glpi_dashboards_items` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_dashboards_rights`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_dashboards_rights` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `dashboards_dashboards_id` int(10) unsigned NOT NULL,
  `itemtype` varchar(100) NOT NULL,
  `items_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`dashboards_dashboards_id`,`itemtype`,`items_id`),
  KEY `item` (`itemtype`,`items_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_dashboards_rights` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_dashboards_rights` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_databaseinstancecategories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_databaseinstancecategories` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_databaseinstancecategories` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_databaseinstancecategories` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_databaseinstances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_databaseinstances` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `name` varchar(255) NOT NULL DEFAULT '',
  `version` varchar(255) NOT NULL DEFAULT '',
  `port` varchar(10) NOT NULL DEFAULT '',
  `path` varchar(255) NOT NULL DEFAULT '',
  `databaseinstancetypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `databaseinstancecategories_id` int(10) unsigned NOT NULL DEFAULT 0,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `manufacturers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id_tech` int(10) unsigned NOT NULL DEFAULT 0,
  `states_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(100) NOT NULL DEFAULT '',
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_onbackup` tinyint(4) NOT NULL DEFAULT 0,
  `is_active` tinyint(4) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_helpdesk_visible` tinyint(4) NOT NULL DEFAULT 1,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `autoupdatesystems_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_lastboot` timestamp NULL DEFAULT NULL,
  `date_lastbackup` timestamp NULL DEFAULT NULL,
  `comment` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `name` (`name`),
  KEY `databaseinstancetypes_id` (`databaseinstancetypes_id`),
  KEY `databaseinstancecategories_id` (`databaseinstancecategories_id`),
  KEY `locations_id` (`locations_id`),
  KEY `manufacturers_id` (`manufacturers_id`),
  KEY `users_id` (`users_id`),
  KEY `users_id_tech` (`users_id_tech`),
  KEY `states_id` (`states_id`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `is_active` (`is_active`),
  KEY `is_deleted` (`is_deleted`),
  KEY `date_creation` (`date_creation`),
  KEY `date_mod` (`date_mod`),
  KEY `is_helpdesk_visible` (`is_helpdesk_visible`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `autoupdatesystems_id` (`autoupdatesystems_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_databaseinstances` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_databaseinstances` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_databaseinstancetypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_databaseinstancetypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_databaseinstancetypes` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_databaseinstancetypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_databases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_databases` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `name` varchar(255) NOT NULL DEFAULT '',
  `size` int(11) NOT NULL DEFAULT 0,
  `databaseinstances_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_onbackup` tinyint(4) NOT NULL DEFAULT 0,
  `is_active` tinyint(4) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_update` timestamp NULL DEFAULT NULL,
  `date_lastbackup` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `name` (`name`),
  KEY `is_active` (`is_active`),
  KEY `is_deleted` (`is_deleted`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `date_creation` (`date_creation`),
  KEY `date_mod` (`date_mod`),
  KEY `databaseinstances_id` (`databaseinstances_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_databases` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_databases` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_datacenters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_datacenters` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `pictures` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `locations_id` (`locations_id`),
  KEY `is_deleted` (`is_deleted`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_datacenters` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_datacenters` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_dcrooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_dcrooms` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `vis_cols` int(11) DEFAULT NULL,
  `vis_rows` int(11) DEFAULT NULL,
  `vis_cell_width` int(11) NOT NULL DEFAULT 40,
  `vis_cell_height` int(11) NOT NULL DEFAULT 40,
  `blueprint` text DEFAULT NULL,
  `datacenters_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `locations_id` (`locations_id`),
  KEY `datacenters_id` (`datacenters_id`),
  KEY `is_deleted` (`is_deleted`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_dcrooms` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_dcrooms` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_defaultfilters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_defaultfilters` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT 1,
  `comment` text DEFAULT NULL,
  `itemtype` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `itemtype` (`itemtype`),
  KEY `name` (`name`),
  KEY `is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_defaultfilters` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_defaultfilters` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_devicebatteries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_devicebatteries` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `designation` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `manufacturers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `voltage` int(11) DEFAULT NULL,
  `capacity` int(11) DEFAULT NULL,
  `devicebatterytypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `devicebatterymodels_id` int(10) unsigned DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `designation` (`designation`),
  KEY `manufacturers_id` (`manufacturers_id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `devicebatterymodels_id` (`devicebatterymodels_id`),
  KEY `devicebatterytypes_id` (`devicebatterytypes_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_devicebatteries` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_devicebatteries` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_devicebatterymodels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_devicebatterymodels` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `product_number` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `product_number` (`product_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_devicebatterymodels` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_devicebatterymodels` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_devicebatterytypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_devicebatterytypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_devicebatterytypes` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_devicebatterytypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_devicecameramodels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_devicecameramodels` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `product_number` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `product_number` (`product_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_devicecameramodels` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_devicecameramodels` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_devicecameras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_devicecameras` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `designation` varchar(255) DEFAULT NULL,
  `flashunit` tinyint(4) NOT NULL DEFAULT 0,
  `lensfacing` varchar(255) DEFAULT NULL,
  `orientation` varchar(255) DEFAULT NULL,
  `focallength` varchar(255) DEFAULT NULL,
  `sensorsize` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `manufacturers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `devicecameramodels_id` int(10) unsigned DEFAULT NULL,
  `support` varchar(255) DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `designation` (`designation`),
  KEY `manufacturers_id` (`manufacturers_id`),
  KEY `devicecameramodels_id` (`devicecameramodels_id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_devicecameras` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_devicecameras` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_devicecasemodels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_devicecasemodels` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `product_number` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `product_number` (`product_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_devicecasemodels` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_devicecasemodels` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_devicecases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_devicecases` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `designation` varchar(255) DEFAULT NULL,
  `devicecasetypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `manufacturers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `devicecasemodels_id` int(10) unsigned DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `designation` (`designation`),
  KEY `manufacturers_id` (`manufacturers_id`),
  KEY `devicecasetypes_id` (`devicecasetypes_id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `devicecasemodels_id` (`devicecasemodels_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_devicecases` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_devicecases` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_devicecasetypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_devicecasetypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_devicecasetypes` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_devicecasetypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_devicecontrolmodels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_devicecontrolmodels` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `product_number` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `product_number` (`product_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_devicecontrolmodels` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_devicecontrolmodels` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_devicecontrols`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_devicecontrols` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `designation` varchar(255) DEFAULT NULL,
  `is_raid` tinyint(4) NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `manufacturers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `interfacetypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `devicecontrolmodels_id` int(10) unsigned DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `designation` (`designation`),
  KEY `manufacturers_id` (`manufacturers_id`),
  KEY `interfacetypes_id` (`interfacetypes_id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `devicecontrolmodels_id` (`devicecontrolmodels_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_devicecontrols` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_devicecontrols` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_devicedrivemodels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_devicedrivemodels` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `product_number` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `product_number` (`product_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_devicedrivemodels` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_devicedrivemodels` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_devicedrives`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_devicedrives` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `designation` varchar(255) DEFAULT NULL,
  `is_writer` tinyint(4) NOT NULL DEFAULT 1,
  `speed` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `manufacturers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `interfacetypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `devicedrivemodels_id` int(10) unsigned DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `designation` (`designation`),
  KEY `manufacturers_id` (`manufacturers_id`),
  KEY `interfacetypes_id` (`interfacetypes_id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `devicedrivemodels_id` (`devicedrivemodels_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_devicedrives` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_devicedrives` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_devicefirmwaremodels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_devicefirmwaremodels` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `product_number` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `product_number` (`product_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_devicefirmwaremodels` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_devicefirmwaremodels` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_devicefirmwares`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_devicefirmwares` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `designation` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `manufacturers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date` date DEFAULT NULL,
  `version` varchar(255) DEFAULT NULL,
  `devicefirmwaretypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `devicefirmwaremodels_id` int(10) unsigned DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `designation` (`designation`),
  KEY `manufacturers_id` (`manufacturers_id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `devicefirmwaremodels_id` (`devicefirmwaremodels_id`),
  KEY `devicefirmwaretypes_id` (`devicefirmwaretypes_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_devicefirmwares` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_devicefirmwares` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_devicefirmwaretypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_devicefirmwaretypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_devicefirmwaretypes` DISABLE KEYS */;
INSERT INTO `glpi_devicefirmwaretypes` VALUES
(1,'BIOS',NULL,NULL,NULL),
(2,'UEFI',NULL,NULL,NULL),
(3,'Firmware',NULL,NULL,NULL);
/*!40000 ALTER TABLE `glpi_devicefirmwaretypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_devicegenericmodels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_devicegenericmodels` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `product_number` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `product_number` (`product_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_devicegenericmodels` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_devicegenericmodels` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_devicegenerics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_devicegenerics` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `designation` varchar(255) DEFAULT NULL,
  `devicegenerictypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `manufacturers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `devicegenericmodels_id` int(10) unsigned DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `designation` (`designation`),
  KEY `manufacturers_id` (`manufacturers_id`),
  KEY `devicegenerictypes_id` (`devicegenerictypes_id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `locations_id` (`locations_id`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `devicegenericmodels_id` (`devicegenericmodels_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_devicegenerics` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_devicegenerics` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_devicegenerictypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_devicegenerictypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_devicegenerictypes` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_devicegenerictypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_devicegraphiccardmodels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_devicegraphiccardmodels` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `product_number` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `product_number` (`product_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_devicegraphiccardmodels` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_devicegraphiccardmodels` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_devicegraphiccards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_devicegraphiccards` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `designation` varchar(255) DEFAULT NULL,
  `interfacetypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `manufacturers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `memory_default` int(11) NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `devicegraphiccardmodels_id` int(10) unsigned DEFAULT NULL,
  `chipset` varchar(255) DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `designation` (`designation`),
  KEY `manufacturers_id` (`manufacturers_id`),
  KEY `interfacetypes_id` (`interfacetypes_id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `chipset` (`chipset`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `devicegraphiccardmodels_id` (`devicegraphiccardmodels_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_devicegraphiccards` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_devicegraphiccards` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_deviceharddrivemodels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_deviceharddrivemodels` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `product_number` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `product_number` (`product_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_deviceharddrivemodels` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_deviceharddrivemodels` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_deviceharddrives`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_deviceharddrives` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `designation` varchar(255) DEFAULT NULL,
  `rpm` varchar(255) DEFAULT NULL,
  `interfacetypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `cache` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `manufacturers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `capacity_default` int(11) NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `deviceharddrivemodels_id` int(10) unsigned DEFAULT NULL,
  `deviceharddrivetypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `designation` (`designation`),
  KEY `manufacturers_id` (`manufacturers_id`),
  KEY `interfacetypes_id` (`interfacetypes_id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `deviceharddrivemodels_id` (`deviceharddrivemodels_id`),
  KEY `deviceharddrivetypes_id` (`deviceharddrivetypes_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_deviceharddrives` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_deviceharddrives` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_deviceharddrivetypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_deviceharddrivetypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_deviceharddrivetypes` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_deviceharddrivetypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_devicememories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_devicememories` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `designation` varchar(255) DEFAULT NULL,
  `frequence` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `manufacturers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `size_default` int(11) NOT NULL DEFAULT 0,
  `devicememorytypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `devicememorymodels_id` int(10) unsigned DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `designation` (`designation`),
  KEY `manufacturers_id` (`manufacturers_id`),
  KEY `devicememorytypes_id` (`devicememorytypes_id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `devicememorymodels_id` (`devicememorymodels_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_devicememories` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_devicememories` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_devicememorymodels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_devicememorymodels` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `product_number` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `product_number` (`product_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_devicememorymodels` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_devicememorymodels` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_devicememorytypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_devicememorytypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_devicememorytypes` DISABLE KEYS */;
INSERT INTO `glpi_devicememorytypes` VALUES
(1,'EDO',NULL,NULL,NULL),
(2,'DDR',NULL,NULL,NULL),
(3,'SDRAM',NULL,NULL,NULL),
(4,'SDRAM-2',NULL,NULL,NULL);
/*!40000 ALTER TABLE `glpi_devicememorytypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_devicemotherboardmodels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_devicemotherboardmodels` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `product_number` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `product_number` (`product_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_devicemotherboardmodels` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_devicemotherboardmodels` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_devicemotherboards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_devicemotherboards` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `designation` varchar(255) DEFAULT NULL,
  `chipset` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `manufacturers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `devicemotherboardmodels_id` int(10) unsigned DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `designation` (`designation`),
  KEY `manufacturers_id` (`manufacturers_id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `devicemotherboardmodels_id` (`devicemotherboardmodels_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_devicemotherboards` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_devicemotherboards` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_devicenetworkcardmodels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_devicenetworkcardmodels` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `product_number` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `product_number` (`product_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_devicenetworkcardmodels` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_devicenetworkcardmodels` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_devicenetworkcards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_devicenetworkcards` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `designation` varchar(255) DEFAULT NULL,
  `bandwidth` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `manufacturers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `mac_default` varchar(255) DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `devicenetworkcardmodels_id` int(10) unsigned DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `designation` (`designation`),
  KEY `manufacturers_id` (`manufacturers_id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `devicenetworkcardmodels_id` (`devicenetworkcardmodels_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_devicenetworkcards` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_devicenetworkcards` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_devicepcimodels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_devicepcimodels` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `product_number` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `product_number` (`product_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_devicepcimodels` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_devicepcimodels` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_devicepcis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_devicepcis` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `designation` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `manufacturers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `devicenetworkcardmodels_id` int(10) unsigned NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `devicepcimodels_id` int(10) unsigned DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `designation` (`designation`),
  KEY `manufacturers_id` (`manufacturers_id`),
  KEY `devicenetworkcardmodels_id` (`devicenetworkcardmodels_id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `devicepcimodels_id` (`devicepcimodels_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_devicepcis` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_devicepcis` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_devicepowersupplies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_devicepowersupplies` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `designation` varchar(255) DEFAULT NULL,
  `power` varchar(255) DEFAULT NULL,
  `is_atx` tinyint(4) NOT NULL DEFAULT 1,
  `comment` text DEFAULT NULL,
  `manufacturers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `devicepowersupplymodels_id` int(10) unsigned DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `designation` (`designation`),
  KEY `manufacturers_id` (`manufacturers_id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `devicepowersupplymodels_id` (`devicepowersupplymodels_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_devicepowersupplies` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_devicepowersupplies` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_devicepowersupplymodels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_devicepowersupplymodels` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `product_number` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `product_number` (`product_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_devicepowersupplymodels` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_devicepowersupplymodels` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_deviceprocessormodels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_deviceprocessormodels` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `product_number` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `product_number` (`product_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_deviceprocessormodels` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_deviceprocessormodels` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_deviceprocessors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_deviceprocessors` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `designation` varchar(255) DEFAULT NULL,
  `frequence` int(11) NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `manufacturers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `frequency_default` int(11) NOT NULL DEFAULT 0,
  `nbcores_default` int(11) DEFAULT NULL,
  `nbthreads_default` int(11) DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `deviceprocessormodels_id` int(10) unsigned DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `designation` (`designation`),
  KEY `manufacturers_id` (`manufacturers_id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `deviceprocessormodels_id` (`deviceprocessormodels_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_deviceprocessors` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_deviceprocessors` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_devicesensormodels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_devicesensormodels` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `product_number` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `product_number` (`product_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_devicesensormodels` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_devicesensormodels` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_devicesensors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_devicesensors` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `designation` varchar(255) DEFAULT NULL,
  `devicesensortypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `devicesensormodels_id` int(10) unsigned NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `manufacturers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `designation` (`designation`),
  KEY `manufacturers_id` (`manufacturers_id`),
  KEY `devicesensortypes_id` (`devicesensortypes_id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `locations_id` (`locations_id`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `devicesensormodels_id` (`devicesensormodels_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_devicesensors` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_devicesensors` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_devicesensortypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_devicesensortypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_devicesensortypes` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_devicesensortypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_devicesimcards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_devicesimcards` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `designation` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `manufacturers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `voltage` int(11) DEFAULT NULL,
  `devicesimcardtypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `allow_voip` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `designation` (`designation`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `devicesimcardtypes_id` (`devicesimcardtypes_id`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `manufacturers_id` (`manufacturers_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_devicesimcards` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_devicesimcards` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_devicesimcardtypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_devicesimcardtypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL DEFAULT '',
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_devicesimcardtypes` DISABLE KEYS */;
INSERT INTO `glpi_devicesimcardtypes` VALUES
(1,'Full SIM',NULL,NULL,NULL),
(2,'Mini SIM',NULL,NULL,NULL),
(3,'Micro SIM',NULL,NULL,NULL),
(4,'Nano SIM',NULL,NULL,NULL);
/*!40000 ALTER TABLE `glpi_devicesimcardtypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_devicesoundcardmodels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_devicesoundcardmodels` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `product_number` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `product_number` (`product_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_devicesoundcardmodels` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_devicesoundcardmodels` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_devicesoundcards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_devicesoundcards` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `designation` varchar(255) DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `manufacturers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `devicesoundcardmodels_id` int(10) unsigned DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `designation` (`designation`),
  KEY `manufacturers_id` (`manufacturers_id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `devicesoundcardmodels_id` (`devicesoundcardmodels_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_devicesoundcards` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_devicesoundcards` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_displaypreferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_displaypreferences` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `itemtype` varchar(100) NOT NULL,
  `num` int(11) NOT NULL DEFAULT 0,
  `rank` int(11) NOT NULL DEFAULT 0,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `interface` varchar(255) NOT NULL DEFAULT 'central',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`users_id`,`itemtype`,`num`,`interface`),
  KEY `rank` (`rank`),
  KEY `num` (`num`),
  KEY `itemtype` (`itemtype`)
) ENGINE=InnoDB AUTO_INCREMENT=350 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_displaypreferences` DISABLE KEYS */;
INSERT INTO `glpi_displaypreferences` VALUES
(1,'Computer',4,4,0,'central'),
(2,'Computer',45,6,0,'central'),
(3,'Computer',40,5,0,'central'),
(4,'Computer',5,3,0,'central'),
(5,'Computer',23,2,0,'central'),
(6,'DocumentType',3,1,0,'central'),
(7,'Monitor',31,1,0,'central'),
(8,'Monitor',23,2,0,'central'),
(9,'Monitor',3,3,0,'central'),
(10,'Monitor',4,4,0,'central'),
(11,'Printer',31,1,0,'central'),
(12,'NetworkEquipment',31,1,0,'central'),
(13,'NetworkEquipment',23,2,0,'central'),
(14,'Printer',23,2,0,'central'),
(15,'Printer',3,3,0,'central'),
(16,'Software',4,3,0,'central'),
(17,'Software',5,2,0,'central'),
(18,'Software',23,1,0,'central'),
(19,'CartridgeItem',4,2,0,'central'),
(20,'CartridgeItem',34,1,0,'central'),
(21,'Peripheral',3,3,0,'central'),
(22,'Peripheral',23,2,0,'central'),
(23,'Peripheral',31,1,0,'central'),
(24,'Computer',31,1,0,'central'),
(25,'Computer',3,7,0,'central'),
(26,'Computer',19,8,0,'central'),
(27,'Computer',17,9,0,'central'),
(28,'NetworkEquipment',3,3,0,'central'),
(29,'NetworkEquipment',4,4,0,'central'),
(30,'NetworkEquipment',11,6,0,'central'),
(31,'NetworkEquipment',19,7,0,'central'),
(32,'Printer',4,4,0,'central'),
(33,'Printer',19,6,0,'central'),
(34,'Monitor',19,6,0,'central'),
(35,'Monitor',7,7,0,'central'),
(36,'Peripheral',4,4,0,'central'),
(37,'Peripheral',19,6,0,'central'),
(38,'Peripheral',7,7,0,'central'),
(39,'Contact',3,1,0,'central'),
(40,'Contact',4,2,0,'central'),
(41,'Contact',5,3,0,'central'),
(42,'Contact',6,4,0,'central'),
(43,'Contact',9,5,0,'central'),
(44,'Supplier',9,1,0,'central'),
(45,'Supplier',3,2,0,'central'),
(46,'Supplier',4,3,0,'central'),
(47,'Supplier',5,4,0,'central'),
(48,'Supplier',10,5,0,'central'),
(49,'Supplier',6,6,0,'central'),
(50,'Contract',4,1,0,'central'),
(51,'Contract',3,2,0,'central'),
(52,'Contract',5,3,0,'central'),
(53,'Contract',6,4,0,'central'),
(54,'Contract',7,5,0,'central'),
(55,'Contract',11,6,0,'central'),
(56,'CartridgeItem',23,3,0,'central'),
(57,'CartridgeItem',3,4,0,'central'),
(58,'DocumentType',6,2,0,'central'),
(59,'DocumentType',4,3,0,'central'),
(60,'DocumentType',5,4,0,'central'),
(61,'Document',3,1,0,'central'),
(62,'Document',4,2,0,'central'),
(63,'Document',7,3,0,'central'),
(64,'Document',5,4,0,'central'),
(65,'Document',16,5,0,'central'),
(66,'User',34,1,0,'central'),
(67,'User',5,3,0,'central'),
(68,'User',6,4,0,'central'),
(69,'User',3,5,0,'central'),
(70,'ConsumableItem',34,1,0,'central'),
(71,'ConsumableItem',4,2,0,'central'),
(72,'ConsumableItem',23,3,0,'central'),
(73,'ConsumableItem',3,4,0,'central'),
(74,'NetworkEquipment',40,5,0,'central'),
(75,'Printer',40,5,0,'central'),
(76,'Monitor',40,5,0,'central'),
(77,'Peripheral',40,5,0,'central'),
(78,'User',8,6,0,'central'),
(79,'Phone',31,1,0,'central'),
(80,'Phone',23,2,0,'central'),
(81,'Phone',3,3,0,'central'),
(82,'Phone',4,4,0,'central'),
(83,'Phone',40,5,0,'central'),
(84,'Phone',19,6,0,'central'),
(85,'Phone',7,7,0,'central'),
(86,'Group',16,1,0,'central'),
(87,'AllAssets',31,1,0,'central'),
(88,'ReservationItem',4,1,0,'central'),
(89,'ReservationItem',3,2,0,'central'),
(90,'Budget',3,2,0,'central'),
(91,'Software',72,4,0,'central'),
(92,'Software',163,5,0,'central'),
(93,'Budget',5,1,0,'central'),
(94,'Budget',4,3,0,'central'),
(95,'Budget',19,4,0,'central'),
(96,'CronTask',8,1,0,'central'),
(97,'CronTask',3,2,0,'central'),
(98,'CronTask',4,3,0,'central'),
(99,'CronTask',5,4,0,'central'),
(100,'CronTask',6,5,0,'central'),
(101,'CronTask',17,6,0,'central'),
(102,'CronTask',18,7,0,'central'),
(103,'CronTask',7,8,0,'central'),
(104,'RequestType',14,1,0,'central'),
(105,'RequestType',15,2,0,'central'),
(106,'NotificationTemplate',4,1,0,'central'),
(107,'NotificationTemplate',16,2,0,'central'),
(108,'Notification',5,1,0,'central'),
(109,'Notification',6,2,0,'central'),
(110,'Notification',2,3,0,'central'),
(111,'Notification',4,4,0,'central'),
(112,'Notification',80,5,0,'central'),
(113,'Notification',86,6,0,'central'),
(114,'MailCollector',2,1,0,'central'),
(115,'MailCollector',19,2,0,'central'),
(116,'AuthLDAP',3,1,0,'central'),
(117,'AuthLDAP',19,2,0,'central'),
(118,'AuthMail',3,1,0,'central'),
(119,'AuthMail',19,2,0,'central'),
(120,'IPNetwork',18,1,0,'central'),
(121,'WifiNetwork',10,1,0,'central'),
(122,'Profile',2,1,0,'central'),
(123,'Profile',3,2,0,'central'),
(124,'Profile',19,3,0,'central'),
(125,'Transfer',19,1,0,'central'),
(126,'TicketValidation',3,1,0,'central'),
(127,'TicketValidation',2,2,0,'central'),
(128,'TicketValidation',8,3,0,'central'),
(129,'TicketValidation',4,4,0,'central'),
(130,'TicketValidation',9,5,0,'central'),
(131,'TicketValidation',7,6,0,'central'),
(132,'NotImportedEmail',2,1,0,'central'),
(133,'NotImportedEmail',5,2,0,'central'),
(134,'NotImportedEmail',4,3,0,'central'),
(135,'NotImportedEmail',6,4,0,'central'),
(136,'NotImportedEmail',16,5,0,'central'),
(137,'NotImportedEmail',19,6,0,'central'),
(138,'RuleRightParameter',11,1,0,'central'),
(139,'Ticket',12,1,0,'central'),
(140,'Ticket',19,2,0,'central'),
(141,'Ticket',15,3,0,'central'),
(142,'Ticket',3,4,0,'central'),
(143,'Ticket',4,5,0,'central'),
(144,'Ticket',5,6,0,'central'),
(145,'Ticket',7,7,0,'central'),
(146,'Calendar',19,1,0,'central'),
(147,'Holiday',11,1,0,'central'),
(148,'Holiday',12,2,0,'central'),
(149,'Holiday',13,3,0,'central'),
(150,'SLA',4,1,0,'central'),
(151,'Ticket',18,8,0,'central'),
(152,'AuthLDAP',30,3,0,'central'),
(153,'AuthMail',6,3,0,'central'),
(154,'FQDN',11,1,0,'central'),
(155,'FieldUnicity',1,1,0,'central'),
(156,'FieldUnicity',80,2,0,'central'),
(157,'FieldUnicity',4,3,0,'central'),
(158,'FieldUnicity',3,4,0,'central'),
(159,'FieldUnicity',86,5,0,'central'),
(160,'FieldUnicity',30,6,0,'central'),
(161,'Problem',21,1,0,'central'),
(162,'Problem',12,2,0,'central'),
(163,'Problem',19,3,0,'central'),
(164,'Problem',15,4,0,'central'),
(165,'Problem',3,5,0,'central'),
(166,'Problem',7,6,0,'central'),
(167,'Problem',18,7,0,'central'),
(168,'Vlan',11,1,0,'central'),
(169,'TicketRecurrent',11,1,0,'central'),
(170,'TicketRecurrent',12,2,0,'central'),
(171,'TicketRecurrent',13,3,0,'central'),
(172,'TicketRecurrent',15,4,0,'central'),
(173,'TicketRecurrent',14,5,0,'central'),
(174,'Reminder',2,1,0,'central'),
(175,'Reminder',3,2,0,'central'),
(176,'Reminder',4,3,0,'central'),
(177,'Reminder',5,4,0,'central'),
(178,'Reminder',6,5,0,'central'),
(179,'Reminder',7,6,0,'central'),
(180,'IPNetwork',10,2,0,'central'),
(181,'IPNetwork',11,3,0,'central'),
(182,'IPNetwork',12,4,0,'central'),
(183,'IPNetwork',17,5,0,'central'),
(184,'NetworkName',12,1,0,'central'),
(185,'NetworkName',13,2,0,'central'),
(186,'RSSFeed',2,1,0,'central'),
(187,'RSSFeed',4,2,0,'central'),
(188,'RSSFeed',5,3,0,'central'),
(189,'RSSFeed',19,4,0,'central'),
(190,'RSSFeed',6,5,0,'central'),
(191,'RSSFeed',7,6,0,'central'),
(192,'Blacklist',12,1,0,'central'),
(193,'Blacklist',11,2,0,'central'),
(194,'ReservationItem',5,3,0,'central'),
(195,'QueuedNotification',16,1,0,'central'),
(196,'QueuedNotification',7,2,0,'central'),
(197,'QueuedNotification',20,3,0,'central'),
(198,'QueuedNotification',21,4,0,'central'),
(199,'QueuedNotification',22,5,0,'central'),
(200,'QueuedNotification',15,6,0,'central'),
(201,'Change',12,1,0,'central'),
(202,'Change',19,2,0,'central'),
(203,'Change',15,3,0,'central'),
(204,'Change',7,4,0,'central'),
(205,'Change',18,5,0,'central'),
(206,'Project',3,1,0,'central'),
(207,'Project',4,2,0,'central'),
(208,'Project',12,3,0,'central'),
(209,'Project',5,4,0,'central'),
(210,'Project',15,5,0,'central'),
(211,'Project',21,6,0,'central'),
(212,'ProjectState',12,1,0,'central'),
(213,'ProjectState',11,2,0,'central'),
(214,'ProjectTask',2,1,0,'central'),
(215,'ProjectTask',12,2,0,'central'),
(216,'ProjectTask',14,3,0,'central'),
(217,'ProjectTask',5,4,0,'central'),
(218,'ProjectTask',7,5,0,'central'),
(219,'ProjectTask',8,6,0,'central'),
(220,'ProjectTask',13,7,0,'central'),
(221,'CartridgeItem',9,5,0,'central'),
(222,'ConsumableItem',9,5,0,'central'),
(223,'ReservationItem',9,4,0,'central'),
(224,'SoftwareLicense',1,1,0,'central'),
(225,'SoftwareLicense',3,2,0,'central'),
(226,'SoftwareLicense',10,3,0,'central'),
(227,'SoftwareLicense',162,4,0,'central'),
(228,'SoftwareLicense',5,5,0,'central'),
(229,'SavedSearch',8,1,0,'central'),
(230,'SavedSearch',9,1,0,'central'),
(231,'SavedSearch',3,1,0,'central'),
(232,'SavedSearch',10,1,0,'central'),
(233,'SavedSearch',11,1,0,'central'),
(234,'Plugin',2,1,0,'central'),
(235,'Plugin',3,2,0,'central'),
(236,'Plugin',4,3,0,'central'),
(237,'Plugin',5,4,0,'central'),
(238,'Plugin',6,5,0,'central'),
(239,'Plugin',7,6,0,'central'),
(240,'Plugin',8,7,0,'central'),
(241,'Glpi\\Event',155,1,0,'central'),
(242,'Glpi\\Event',156,2,0,'central'),
(243,'Glpi\\Event',157,3,0,'central'),
(244,'Glpi\\Event',158,4,0,'central'),
(245,'Glpi\\Event',159,5,0,'central'),
(246,'Glpi\\Event',160,6,0,'central'),
(247,'Glpi\\Form\\Form',1,1,0,'central'),
(248,'Glpi\\Form\\Form',80,2,0,'central'),
(249,'Glpi\\Form\\Form',86,3,0,'central'),
(250,'Glpi\\Form\\Form',3,4,0,'central'),
(251,'Glpi\\Form\\Form',4,5,0,'central'),
(252,'Glpi\\Form\\AnswersSet',1,1,0,'central'),
(253,'Glpi\\Form\\AnswersSet',3,2,0,'central'),
(254,'Glpi\\Form\\AnswersSet',4,3,0,'central'),
(255,'Cluster',31,1,0,'central'),
(256,'Cluster',19,2,0,'central'),
(257,'Domain',3,1,0,'central'),
(258,'Domain',4,2,0,'central'),
(259,'Domain',2,3,0,'central'),
(260,'Domain',6,4,0,'central'),
(261,'Domain',7,5,0,'central'),
(262,'DomainRecord',2,1,0,'central'),
(263,'DomainRecord',3,2,0,'central'),
(264,'Appliance',2,1,0,'central'),
(265,'Appliance',3,2,0,'central'),
(266,'Appliance',4,3,0,'central'),
(267,'Appliance',5,4,0,'central'),
(268,'Lockedfield',3,1,0,'central'),
(269,'Lockedfield',13,2,0,'central'),
(270,'Lockedfield',5,3,0,'central'),
(271,'Unmanaged',2,1,0,'central'),
(272,'Unmanaged',4,2,0,'central'),
(273,'Unmanaged',3,3,0,'central'),
(274,'Unmanaged',5,4,0,'central'),
(275,'Unmanaged',7,5,0,'central'),
(276,'Unmanaged',10,6,0,'central'),
(277,'Unmanaged',18,7,0,'central'),
(278,'Unmanaged',14,8,0,'central'),
(279,'Unmanaged',15,9,0,'central'),
(280,'Unmanaged',9,10,0,'central'),
(281,'NetworkPortType',10,1,0,'central'),
(282,'NetworkPortType',11,2,0,'central'),
(283,'NetworkPortType',12,3,0,'central'),
(284,'NetworkPort',3,1,0,'central'),
(285,'NetworkPort',30,2,0,'central'),
(286,'NetworkPort',31,3,0,'central'),
(287,'NetworkPort',32,4,0,'central'),
(288,'NetworkPort',33,5,0,'central'),
(289,'NetworkPort',34,6,0,'central'),
(290,'NetworkPort',35,7,0,'central'),
(291,'NetworkPort',36,8,0,'central'),
(292,'NetworkPort',38,9,0,'central'),
(293,'NetworkPort',39,10,0,'central'),
(294,'NetworkPort',40,11,0,'central'),
(295,'NetworkPort',6,12,0,'central'),
(296,'USBVendor',10,1,0,'central'),
(297,'USBVendor',11,2,0,'central'),
(298,'PCIVendor',10,1,0,'central'),
(299,'PCIVendor',11,2,0,'central'),
(300,'Agent',2,1,0,'central'),
(301,'Agent',4,2,0,'central'),
(302,'Agent',10,3,0,'central'),
(303,'Agent',8,4,0,'central'),
(304,'Agent',11,5,0,'central'),
(305,'Agent',6,6,0,'central'),
(306,'Agent',15,7,0,'central'),
(307,'Database',2,1,0,'central'),
(308,'Database',3,2,0,'central'),
(309,'Database',6,3,0,'central'),
(310,'Database',9,4,0,'central'),
(311,'Database',10,5,0,'central'),
(312,'Glpi\\Socket',5,1,0,'central'),
(313,'Glpi\\Socket',6,2,0,'central'),
(314,'Glpi\\Socket',9,3,0,'central'),
(315,'Glpi\\Socket',8,4,0,'central'),
(316,'Glpi\\Socket',7,5,0,'central'),
(317,'Cable',4,1,0,'central'),
(318,'Cable',31,2,0,'central'),
(319,'Cable',6,3,0,'central'),
(320,'Cable',15,4,0,'central'),
(321,'Cable',24,5,0,'central'),
(322,'Cable',8,6,0,'central'),
(323,'Cable',10,7,0,'central'),
(324,'Cable',13,8,0,'central'),
(325,'Cable',14,9,0,'central'),
(326,'KnowbaseItem',79,1,0,'central'),
(327,'KnowbaseItem',131,2,0,'central'),
(328,'KnowbaseItem',13,3,0,'central'),
(329,'Webhook',3,1,0,'central'),
(330,'Webhook',4,2,0,'central'),
(331,'Webhook',5,3,0,'central'),
(332,'QueuedWebhook',80,1,0,'central'),
(333,'QueuedWebhook',2,2,0,'central'),
(334,'QueuedWebhook',22,3,0,'central'),
(335,'QueuedWebhook',20,4,0,'central'),
(336,'QueuedWebhook',21,5,0,'central'),
(337,'QueuedWebhook',7,6,0,'central'),
(338,'QueuedWebhook',30,7,0,'central'),
(339,'QueuedWebhook',16,8,0,'central'),
(340,'Consumable',2,1,0,'central'),
(341,'Consumable',8,2,0,'central'),
(342,'Consumable',3,3,0,'central'),
(343,'Consumable',4,4,0,'central'),
(344,'Consumable',5,5,0,'central'),
(345,'Consumable',6,6,0,'central'),
(346,'Consumable',7,7,0,'central'),
(347,'Ticket',12,1,0,'helpdesk'),
(348,'Ticket',19,2,0,'helpdesk'),
(349,'Ticket',15,3,0,'helpdesk');
/*!40000 ALTER TABLE `glpi_displaypreferences` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_documentcategories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_documentcategories` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `documentcategories_id` int(10) unsigned NOT NULL DEFAULT 0,
  `completename` text DEFAULT NULL,
  `level` int(11) NOT NULL DEFAULT 0,
  `ancestors_cache` longtext DEFAULT NULL,
  `sons_cache` longtext DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`documentcategories_id`,`name`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `level` (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_documentcategories` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_documentcategories` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_documents` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `filename` varchar(255) DEFAULT NULL,
  `filepath` varchar(255) DEFAULT NULL,
  `documentcategories_id` int(10) unsigned NOT NULL DEFAULT 0,
  `mime` varchar(255) DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `link` varchar(255) DEFAULT NULL,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `tickets_id` int(10) unsigned NOT NULL DEFAULT 0,
  `sha1sum` char(40) DEFAULT NULL,
  `is_blacklisted` tinyint(4) NOT NULL DEFAULT 0,
  `tag` varchar(255) DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `date_mod` (`date_mod`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `tickets_id` (`tickets_id`),
  KEY `users_id` (`users_id`),
  KEY `documentcategories_id` (`documentcategories_id`),
  KEY `is_deleted` (`is_deleted`),
  KEY `sha1sum` (`sha1sum`),
  KEY `tag` (`tag`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_documents` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_documents_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_documents_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `documents_id` int(10) unsigned NOT NULL DEFAULT 0,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(100) NOT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `users_id` int(10) unsigned DEFAULT 0,
  `timeline_position` tinyint(4) NOT NULL DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT NULL,
  `date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`documents_id`,`itemtype`,`items_id`,`timeline_position`),
  KEY `item` (`itemtype`,`items_id`,`entities_id`,`is_recursive`),
  KEY `users_id` (`users_id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `date_creation` (`date_creation`),
  KEY `date_mod` (`date_mod`),
  KEY `date` (`date`),
  KEY `timeline_position` (`timeline_position`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_documents_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_documents_items` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_documenttypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_documenttypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `ext` varchar(255) DEFAULT NULL,
  `icon` varchar(255) DEFAULT NULL,
  `mime` varchar(255) DEFAULT NULL,
  `is_uploadable` tinyint(4) NOT NULL DEFAULT 1,
  `date_mod` timestamp NULL DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`ext`),
  KEY `name` (`name`),
  KEY `is_uploadable` (`is_uploadable`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB AUTO_INCREMENT=74 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_documenttypes` DISABLE KEYS */;
INSERT INTO `glpi_documenttypes` VALUES
(1,'JPEG','jpg','jpg-dist.png',NULL,1,NULL,NULL,NULL),
(2,'PNG','png','png-dist.png',NULL,1,NULL,NULL,NULL),
(3,'GIF','gif','gif-dist.png',NULL,1,NULL,NULL,NULL),
(4,'BMP','bmp','bmp-dist.png',NULL,1,NULL,NULL,NULL),
(5,'Photoshop','psd','psd-dist.png',NULL,1,NULL,NULL,NULL),
(6,'TIFF','tif','tif-dist.png',NULL,1,NULL,NULL,NULL),
(7,'AIFF','aiff','aiff-dist.png',NULL,1,NULL,NULL,NULL),
(8,'Windows Media','asf','asf-dist.png',NULL,1,NULL,NULL,NULL),
(9,'Windows Media','avi','avi-dist.png',NULL,1,NULL,NULL,NULL),
(10,'BZip','bz2','bz2-dist.png',NULL,1,NULL,NULL,NULL),
(11,'Word','doc','doc-dist.png',NULL,1,NULL,NULL,NULL),
(12,'DjVu','djvu','',NULL,1,NULL,NULL,NULL),
(13,'PostScript','eps','ps-dist.png',NULL,1,NULL,NULL,NULL),
(14,'GZ','gz','gz-dist.png',NULL,1,NULL,NULL,NULL),
(15,'HTML','html','html-dist.png',NULL,1,NULL,NULL,NULL),
(16,'Midi','mid','mid-dist.png',NULL,1,NULL,NULL,NULL),
(17,'QuickTime','mov','mov-dist.png',NULL,1,NULL,NULL,NULL),
(18,'MP3','mp3','mp3-dist.png',NULL,1,NULL,NULL,NULL),
(19,'MPEG','mpg','mpg-dist.png',NULL,1,NULL,NULL,NULL),
(20,'Ogg Vorbis','ogg','ogg-dist.png',NULL,1,NULL,NULL,NULL),
(21,'PDF','pdf','pdf-dist.png',NULL,1,NULL,NULL,NULL),
(22,'PowerPoint','ppt','ppt-dist.png',NULL,1,NULL,NULL,NULL),
(23,'PostScript','ps','ps-dist.png',NULL,1,NULL,NULL,NULL),
(24,'QuickTime','qt','qt-dist.png',NULL,1,NULL,NULL,NULL),
(25,'RealAudio','ra','ra-dist.png',NULL,1,NULL,NULL,NULL),
(26,'RealAudio','ram','ram-dist.png',NULL,1,NULL,NULL,NULL),
(27,'RealAudio','rm','rm-dist.png',NULL,1,NULL,NULL,NULL),
(28,'RTF','rtf','rtf-dist.png',NULL,1,NULL,NULL,NULL),
(29,'StarOffice','sdd','sdd-dist.png',NULL,1,NULL,NULL,NULL),
(30,'StarOffice','sdw','sdw-dist.png',NULL,1,NULL,NULL,NULL),
(31,'Stuffit','sit','sit-dist.png',NULL,1,NULL,NULL,NULL),
(32,'OpenOffice Impress','sxi','sxi-dist.png',NULL,1,NULL,NULL,NULL),
(33,'OpenOffice','sxw','sxw-dist.png',NULL,1,NULL,NULL,NULL),
(34,'Flash','swf','swf-dist.png',NULL,1,NULL,NULL,NULL),
(35,'TGZ','tgz','tgz-dist.png',NULL,1,NULL,NULL,NULL),
(36,'texte','txt','txt-dist.png',NULL,1,NULL,NULL,NULL),
(37,'WAV','wav','wav-dist.png',NULL,1,NULL,NULL,NULL),
(38,'Excel','xls','xls-dist.png',NULL,1,NULL,NULL,NULL),
(39,'XML','xml','xml-dist.png',NULL,1,NULL,NULL,NULL),
(40,'Windows Media','wmv','wmv-dist.png',NULL,1,NULL,NULL,NULL),
(41,'Zip','zip','zip-dist.png',NULL,1,NULL,NULL,NULL),
(42,'MNG','mng','',NULL,1,NULL,NULL,NULL),
(43,'Adobe Illustrator','ai','ai-dist.png',NULL,1,NULL,NULL,NULL),
(44,'C source','c','c-dist.png',NULL,1,NULL,NULL,NULL),
(45,'Debian','deb','deb-dist.png',NULL,1,NULL,NULL,NULL),
(46,'DVI','dvi','dvi-dist.png',NULL,1,NULL,NULL,NULL),
(47,'C header','h','h-dist.png',NULL,1,NULL,NULL,NULL),
(48,'Pascal','pas','pas-dist.png',NULL,1,NULL,NULL,NULL),
(49,'RedHat/Mandrake/SuSE','rpm','rpm-dist.png',NULL,1,NULL,NULL,NULL),
(50,'OpenOffice Calc','sxc','sxc-dist.png',NULL,1,NULL,NULL,NULL),
(51,'LaTeX','tex','tex-dist.png',NULL,1,NULL,NULL,NULL),
(52,'GIMP multi-layer','xcf','xcf-dist.png',NULL,1,NULL,NULL,NULL),
(53,'JPEG','jpeg','jpg-dist.png',NULL,1,NULL,NULL,NULL),
(54,'Oasis Open Office Writer','odt','odt-dist.png',NULL,1,NULL,NULL,NULL),
(55,'Oasis Open Office Calc','ods','ods-dist.png',NULL,1,NULL,NULL,NULL),
(56,'Oasis Open Office Impress','odp','odp-dist.png',NULL,1,NULL,NULL,NULL),
(57,'Oasis Open Office Impress Template','otp','odp-dist.png',NULL,1,NULL,NULL,NULL),
(58,'Oasis Open Office Writer Template','ott','odt-dist.png',NULL,1,NULL,NULL,NULL),
(59,'Oasis Open Office Calc Template','ots','ods-dist.png',NULL,1,NULL,NULL,NULL),
(60,'Oasis Open Office Math','odf','odf-dist.png',NULL,1,NULL,NULL,NULL),
(61,'Oasis Open Office Draw','odg','odg-dist.png',NULL,1,NULL,NULL,NULL),
(62,'Oasis Open Office Draw Template','otg','odg-dist.png',NULL,1,NULL,NULL,NULL),
(63,'Oasis Open Office Base','odb','odb-dist.png',NULL,1,NULL,NULL,NULL),
(64,'Oasis Open Office HTML','oth','oth-dist.png',NULL,1,NULL,NULL,NULL),
(65,'Oasis Open Office Writer Master','odm','odm-dist.png',NULL,1,NULL,NULL,NULL),
(66,'Oasis Open Office Chart','odc','',NULL,1,NULL,NULL,NULL),
(67,'Oasis Open Office Image','odi','',NULL,1,NULL,NULL,NULL),
(68,'Word XML','docx','doc-dist.png',NULL,1,NULL,NULL,NULL),
(69,'Excel XML','xlsx','xls-dist.png',NULL,1,NULL,NULL,NULL),
(70,'PowerPoint XML','pptx','ppt-dist.png',NULL,1,NULL,NULL,NULL),
(71,'Comma-Separated Values','csv','csv-dist.png',NULL,1,NULL,NULL,NULL),
(72,'Scalable Vector Graphics','svg','svg-dist.png',NULL,1,NULL,NULL,NULL),
(73,'WebP','webp','webp-dist.png',NULL,1,NULL,NULL,NULL);
/*!40000 ALTER TABLE `glpi_documenttypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_domainrecords`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_domainrecords` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `data` text DEFAULT NULL,
  `data_obj` text DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `domains_id` int(10) unsigned NOT NULL DEFAULT 0,
  `domainrecordtypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `ttl` int(11) NOT NULL,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id_tech` int(10) unsigned NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `domains_id` (`domains_id`),
  KEY `domainrecordtypes_id` (`domainrecordtypes_id`),
  KEY `users_id` (`users_id`),
  KEY `users_id_tech` (`users_id_tech`),
  KEY `date_mod` (`date_mod`),
  KEY `is_deleted` (`is_deleted`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_domainrecords` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_domainrecords` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_domainrecordtypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_domainrecordtypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `fields` text DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_domainrecordtypes` DISABLE KEYS */;
INSERT INTO `glpi_domainrecordtypes` VALUES
(1,'A','[]',0,1,'Host address'),
(2,'AAAA','[]',0,1,'IPv6 host address'),
(3,'ALIAS','[]',0,1,'Auto resolved alias'),
(4,'CNAME','[{\"key\":\"target\",\"label\":\"Target\",\"placeholder\":\"sip.example.com.\",\"is_fqdn\":true}]',0,1,'Canonical name for an alias'),
(5,'MX','[{\"key\":\"priority\",\"label\":\"Priority\",\"placeholder\":\"10\"},{\"key\":\"server\",\"label\":\"Server\",\"placeholder\":\"mail.example.com.\",\"is_fqdn\":true}]',0,1,'Mail eXchange'),
(6,'NS','[]',0,1,'Name Server'),
(7,'PTR','[]',0,1,'Pointer'),
(8,'SOA','[{\"key\":\"primary_name_server\",\"label\":\"Primary name server\",\"placeholder\":\"ns1.example.com.\",\"is_fqdn\":true},{\"key\":\"primary_contact\",\"label\":\"Primary contact\",\"placeholder\":\"admin.example.com.\",\"is_fqdn\":true},{\"key\":\"serial\",\"label\":\"Serial\",\"placeholder\":\"2020010101\"},{\"key\":\"zone_refresh_timer\",\"label\":\"Zone refresh timer\",\"placeholder\":\"86400\"},{\"key\":\"failed_refresh_retry_timer\",\"label\":\"Failed refresh retry timer\",\"placeholder\":\"7200\"},{\"key\":\"zone_expiry_timer\",\"label\":\"Zone expiry timer\",\"placeholder\":\"1209600\"},{\"key\":\"minimum_ttl\",\"label\":\"Minimum TTL\",\"placeholder\":\"300\"}]',0,1,'Start Of Authority'),
(9,'SRV','[{\"key\":\"priority\",\"label\":\"Priority\",\"placeholder\":\"0\"},{\"key\":\"weight\",\"label\":\"Weight\",\"placeholder\":\"10\"},{\"key\":\"port\",\"label\":\"Port\",\"placeholder\":\"5060\"},{\"key\":\"target\",\"label\":\"Target\",\"placeholder\":\"sip.example.com.\",\"is_fqdn\":true}]',0,1,'Location of service'),
(10,'TXT','[{\"key\":\"data\",\"label\":\"TXT record data\",\"placeholder\":\"Your TXT record data\",\"quote_value\":true}]',0,1,'Descriptive text'),
(11,'CAA','[{\"key\":\"flag\",\"label\":\"Flag\",\"placeholder\":\"0\"},{\"key\":\"tag\",\"label\":\"Tag\",\"placeholder\":\"issue\"},{\"key\":\"value\",\"label\":\"Value\",\"placeholder\":\"letsencrypt.org\",\"quote_value\":true}]',0,1,'Certification Authority Authorization');
/*!40000 ALTER TABLE `glpi_domainrecordtypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_domainrelations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_domainrelations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_domainrelations` DISABLE KEYS */;
INSERT INTO `glpi_domainrelations` VALUES
(1,'Belongs',0,1,'Item belongs to domain'),
(2,'Manage',0,1,'Item manages domain');
/*!40000 ALTER TABLE `glpi_domainrelations` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_domains`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_domains` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `domaintypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date_expiration` timestamp NULL DEFAULT NULL,
  `date_domaincreation` timestamp NULL DEFAULT NULL,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id_tech` int(10) unsigned NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `is_template` tinyint(4) NOT NULL DEFAULT 0,
  `template_name` varchar(255) DEFAULT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `domaintypes_id` (`domaintypes_id`),
  KEY `users_id` (`users_id`),
  KEY `users_id_tech` (`users_id_tech`),
  KEY `date_mod` (`date_mod`),
  KEY `is_template` (`is_template`),
  KEY `active_assets` (`is_deleted`,`is_template`),
  KEY `is_active` (`is_active`),
  KEY `date_expiration` (`date_expiration`),
  KEY `date_domaincreation` (`date_domaincreation`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_domains` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_domains` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_domains_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_domains_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `domains_id` int(10) unsigned NOT NULL DEFAULT 0,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(100) NOT NULL,
  `domainrelations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`domains_id`,`itemtype`,`items_id`),
  KEY `domainrelations_id` (`domainrelations_id`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `is_deleted` (`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_domains_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_domains_items` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_domaintypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_domaintypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_domaintypes` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_domaintypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_dropdowns_dropdowndefinitions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_dropdowns_dropdowndefinitions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `system_name` varchar(255) DEFAULT NULL,
  `label` varchar(255) NOT NULL,
  `icon` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT 0,
  `profiles` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`profiles`)),
  `translations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`translations`)),
  `date_creation` timestamp NULL DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `system_name` (`system_name`),
  KEY `label` (`label`),
  KEY `is_active` (`is_active`),
  KEY `date_creation` (`date_creation`),
  KEY `date_mod` (`date_mod`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_dropdowns_dropdowndefinitions` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_dropdowns_dropdowndefinitions` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_dropdowns_dropdowns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_dropdowns_dropdowns` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `dropdowns_dropdowndefinitions_id` int(10) unsigned NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `dropdowns_dropdowns_id` int(10) unsigned NOT NULL DEFAULT 0,
  `completename` text DEFAULT NULL,
  `level` int(11) NOT NULL DEFAULT 0,
  `ancestors_cache` longtext DEFAULT NULL,
  `sons_cache` longtext DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `dropdowns_dropdowndefinitions_id` (`dropdowns_dropdowndefinitions_id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `dropdowns_dropdowns_id` (`dropdowns_dropdowns_id`),
  KEY `level` (`level`),
  KEY `date_creation` (`date_creation`),
  KEY `date_mod` (`date_mod`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_dropdowns_dropdowns` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_dropdowns_dropdowns` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_dropdowntranslations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_dropdowntranslations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(100) DEFAULT NULL,
  `language` varchar(10) DEFAULT NULL,
  `field` varchar(100) DEFAULT NULL,
  `value` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`itemtype`,`items_id`,`language`,`field`),
  KEY `language` (`language`),
  KEY `field` (`field`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_dropdowntranslations` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_dropdowntranslations` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_dropdownvisibilities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_dropdownvisibilities` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `itemtype` varchar(100) NOT NULL DEFAULT '',
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `visible_itemtype` varchar(100) NOT NULL DEFAULT '',
  `is_visible` tinyint(4) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `visible_itemtype` (`visible_itemtype`),
  KEY `item` (`itemtype`,`items_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_dropdownvisibilities` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_dropdownvisibilities` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_enclosuremodels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_enclosuremodels` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `product_number` varchar(255) DEFAULT NULL,
  `weight` int(11) NOT NULL DEFAULT 0,
  `required_units` int(11) NOT NULL DEFAULT 1,
  `depth` float NOT NULL DEFAULT 1,
  `power_connections` int(11) NOT NULL DEFAULT 0,
  `power_consumption` int(11) NOT NULL DEFAULT 0,
  `is_half_rack` tinyint(4) NOT NULL DEFAULT 0,
  `picture_front` text DEFAULT NULL,
  `picture_rear` text DEFAULT NULL,
  `pictures` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `product_number` (`product_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_enclosuremodels` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_enclosuremodels` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_enclosures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_enclosures` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `serial` varchar(255) DEFAULT NULL,
  `otherserial` varchar(255) DEFAULT NULL,
  `enclosuremodels_id` int(10) unsigned DEFAULT NULL,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id_tech` int(10) unsigned NOT NULL DEFAULT 0,
  `is_template` tinyint(4) NOT NULL DEFAULT 0,
  `template_name` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `orientation` tinyint(4) DEFAULT NULL,
  `power_supplies` tinyint(4) NOT NULL DEFAULT 0,
  `states_id` int(10) unsigned NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `manufacturers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `locations_id` (`locations_id`),
  KEY `enclosuremodels_id` (`enclosuremodels_id`),
  KEY `users_id` (`users_id`),
  KEY `users_id_tech` (`users_id_tech`),
  KEY `is_template` (`is_template`),
  KEY `active_assets` (`is_deleted`,`is_template`),
  KEY `states_id` (`states_id`),
  KEY `manufacturers_id` (`manufacturers_id`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_enclosures` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_enclosures` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_entities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_entities` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `entities_id` int(10) unsigned DEFAULT 0,
  `completename` text DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `level` int(11) NOT NULL DEFAULT 0,
  `sons_cache` longtext DEFAULT NULL,
  `ancestors_cache` longtext DEFAULT NULL,
  `registration_number` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `postcode` varchar(255) DEFAULT NULL,
  `town` varchar(255) DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `phonenumber` varchar(255) DEFAULT NULL,
  `fax` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `admin_email` varchar(255) DEFAULT NULL,
  `admin_email_name` varchar(255) DEFAULT NULL,
  `from_email` varchar(255) DEFAULT NULL,
  `from_email_name` varchar(255) DEFAULT NULL,
  `noreply_email` varchar(255) DEFAULT NULL,
  `noreply_email_name` varchar(255) DEFAULT NULL,
  `replyto_email` varchar(255) DEFAULT NULL,
  `replyto_email_name` varchar(255) DEFAULT NULL,
  `notification_subject_tag` varchar(255) DEFAULT NULL,
  `ldap_dn` varchar(255) DEFAULT NULL,
  `tag` varchar(255) DEFAULT NULL,
  `authldaps_id` int(10) unsigned NOT NULL DEFAULT 0,
  `mail_domain` varchar(255) DEFAULT NULL,
  `entity_ldapfilter` text DEFAULT NULL,
  `mailing_signature` text DEFAULT NULL,
  `url_base` text DEFAULT NULL,
  `cartridges_alert_repeat` int(11) NOT NULL DEFAULT -2,
  `consumables_alert_repeat` int(11) NOT NULL DEFAULT -2,
  `use_licenses_alert` int(11) NOT NULL DEFAULT -2,
  `send_licenses_alert_before_delay` int(11) NOT NULL DEFAULT -2,
  `use_certificates_alert` int(11) NOT NULL DEFAULT -2,
  `send_certificates_alert_before_delay` int(11) NOT NULL DEFAULT -2,
  `certificates_alert_repeat_interval` int(11) NOT NULL DEFAULT -2,
  `use_contracts_alert` int(11) NOT NULL DEFAULT -2,
  `send_contracts_alert_before_delay` int(11) NOT NULL DEFAULT -2,
  `use_infocoms_alert` int(11) NOT NULL DEFAULT -2,
  `send_infocoms_alert_before_delay` int(11) NOT NULL DEFAULT -2,
  `use_reservations_alert` int(11) NOT NULL DEFAULT -2,
  `use_domains_alert` int(11) NOT NULL DEFAULT -2,
  `send_domains_alert_close_expiries_delay` int(11) NOT NULL DEFAULT -2,
  `send_domains_alert_expired_delay` int(11) NOT NULL DEFAULT -2,
  `autoclose_delay` int(11) NOT NULL DEFAULT -2,
  `autopurge_delay` int(11) NOT NULL DEFAULT -2,
  `notclosed_delay` int(11) NOT NULL DEFAULT -2,
  `calendars_strategy` tinyint(4) NOT NULL DEFAULT -2,
  `calendars_id` int(10) unsigned NOT NULL DEFAULT 0,
  `auto_assign_mode` int(11) NOT NULL DEFAULT -2,
  `tickettype` int(11) NOT NULL DEFAULT -2,
  `max_closedate` timestamp NULL DEFAULT NULL,
  `inquest_config` int(11) NOT NULL DEFAULT -2,
  `inquest_rate` int(11) NOT NULL DEFAULT 0,
  `inquest_delay` int(11) NOT NULL DEFAULT -10,
  `inquest_URL` text DEFAULT NULL,
  `inquest_max_rate` int(11) NOT NULL DEFAULT 5,
  `inquest_default_rate` int(11) NOT NULL DEFAULT 3,
  `inquest_mandatory_comment` int(11) NOT NULL DEFAULT 0,
  `max_closedate_change` timestamp NULL DEFAULT NULL,
  `inquest_config_change` int(11) NOT NULL DEFAULT -2,
  `inquest_rate_change` int(11) NOT NULL DEFAULT 0,
  `inquest_delay_change` int(11) NOT NULL DEFAULT -10,
  `inquest_URL_change` text DEFAULT NULL,
  `inquest_max_rate_change` int(11) NOT NULL DEFAULT 5,
  `inquest_default_rate_change` int(11) NOT NULL DEFAULT 3,
  `inquest_mandatory_comment_change` int(11) NOT NULL DEFAULT 0,
  `autofill_warranty_date` varchar(255) NOT NULL DEFAULT '-2',
  `autofill_use_date` varchar(255) NOT NULL DEFAULT '-2',
  `autofill_buy_date` varchar(255) NOT NULL DEFAULT '-2',
  `autofill_delivery_date` varchar(255) NOT NULL DEFAULT '-2',
  `autofill_order_date` varchar(255) NOT NULL DEFAULT '-2',
  `tickettemplates_strategy` tinyint(4) NOT NULL DEFAULT -2,
  `tickettemplates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `changetemplates_strategy` tinyint(4) NOT NULL DEFAULT -2,
  `changetemplates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `problemtemplates_strategy` tinyint(4) NOT NULL DEFAULT -2,
  `problemtemplates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `entities_strategy_software` tinyint(4) NOT NULL DEFAULT -2,
  `entities_id_software` int(10) unsigned NOT NULL DEFAULT 0,
  `default_contract_alert` int(11) NOT NULL DEFAULT -2,
  `default_infocom_alert` int(11) NOT NULL DEFAULT -2,
  `default_cartridges_alarm_threshold` int(11) NOT NULL DEFAULT -2,
  `default_consumables_alarm_threshold` int(11) NOT NULL DEFAULT -2,
  `delay_send_emails` int(11) NOT NULL DEFAULT -2,
  `is_notif_enable_default` int(11) NOT NULL DEFAULT -2,
  `inquest_duration` int(11) NOT NULL DEFAULT 0,
  `inquest_duration_change` int(11) NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `autofill_decommission_date` varchar(255) NOT NULL DEFAULT '-2',
  `suppliers_as_private` int(11) NOT NULL DEFAULT -2,
  `anonymize_support_agents` int(11) NOT NULL DEFAULT -2,
  `display_users_initials` int(11) NOT NULL DEFAULT -2,
  `contracts_strategy_default` tinyint(4) NOT NULL DEFAULT -2,
  `contracts_id_default` int(10) unsigned NOT NULL DEFAULT 0,
  `enable_custom_css` int(11) NOT NULL DEFAULT -2,
  `custom_css_code` text DEFAULT NULL,
  `latitude` varchar(255) DEFAULT NULL,
  `longitude` varchar(255) DEFAULT NULL,
  `altitude` varchar(255) DEFAULT NULL,
  `transfers_strategy` tinyint(4) NOT NULL DEFAULT -2,
  `transfers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `agent_base_url` varchar(255) DEFAULT NULL,
  `approval_reminder_repeat_interval` int(11) NOT NULL DEFAULT -2,
  `2fa_enforcement_strategy` tinyint(4) NOT NULL DEFAULT -2,
  `is_contact_autoupdate` tinyint(4) NOT NULL DEFAULT -2,
  `is_user_autoupdate` tinyint(4) NOT NULL DEFAULT -2,
  `is_group_autoupdate` tinyint(4) NOT NULL DEFAULT -2,
  `is_location_autoupdate` tinyint(4) NOT NULL DEFAULT -2,
  `state_autoupdate_mode` int(11) NOT NULL DEFAULT -2,
  `is_contact_autoclean` tinyint(4) NOT NULL DEFAULT -2,
  `is_user_autoclean` tinyint(4) NOT NULL DEFAULT -2,
  `is_group_autoclean` tinyint(4) NOT NULL DEFAULT -2,
  `is_location_autoclean` tinyint(4) NOT NULL DEFAULT -2,
  `state_autoclean_mode` int(11) NOT NULL DEFAULT -2,
  `show_tickets_properties_on_helpdesk` int(11) NOT NULL DEFAULT -2,
  `custom_helpdesk_home_scene_left` varchar(255) NOT NULL DEFAULT '-2',
  `custom_helpdesk_home_scene_right` varchar(255) NOT NULL DEFAULT '-2',
  `custom_helpdesk_home_title` varchar(255) NOT NULL DEFAULT '-2',
  `enable_helpdesk_home_search_bar` tinyint(4) NOT NULL DEFAULT -2,
  `enable_helpdesk_service_catalog` tinyint(4) NOT NULL DEFAULT -2,
  `expand_service_catalog` tinyint(4) NOT NULL DEFAULT -2,
  `service_catalog_default_sort_strategy` varchar(255) NOT NULL DEFAULT '-2',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`entities_id`,`name`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `tickettemplates_id` (`tickettemplates_id`),
  KEY `changetemplates_id` (`changetemplates_id`),
  KEY `problemtemplates_id` (`problemtemplates_id`),
  KEY `transfers_id` (`transfers_id`),
  KEY `authldaps_id` (`authldaps_id`),
  KEY `calendars_id` (`calendars_id`),
  KEY `entities_id_software` (`entities_id_software`),
  KEY `contracts_id_default` (`contracts_id_default`),
  KEY `level` (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_entities` DISABLE KEYS */;
INSERT INTO `glpi_entities` VALUES
(0,'Entidad raíz',NULL,'Entidad raíz',NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,0,0,0,0,0,0,0,0,0,0,0,0,0,30,1,-10,-10,0,0,0,-10,1,NULL,1,0,0,NULL,5,3,0,NULL,1,0,0,NULL,5,3,0,'0','0','0','0','0',0,1,0,1,0,1,-10,0,0,0,10,10,0,1,0,0,NULL,NULL,'0',0,0,1,0,0,0,'',NULL,NULL,NULL,0,0,NULL,0,0,1,1,1,1,0,0,0,0,0,0,0,'','','',1,1,0,'popularity');
/*!40000 ALTER TABLE `glpi_entities` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_entities_knowbaseitems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_entities_knowbaseitems` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `knowbaseitems_id` int(10) unsigned NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `knowbaseitems_id` (`knowbaseitems_id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_entities_knowbaseitems` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_entities_knowbaseitems` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_entities_reminders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_entities_reminders` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `reminders_id` int(10) unsigned NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `reminders_id` (`reminders_id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_entities_reminders` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_entities_reminders` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_entities_rssfeeds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_entities_rssfeeds` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `rssfeeds_id` int(10) unsigned NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `rssfeeds_id` (`rssfeeds_id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_entities_rssfeeds` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_entities_rssfeeds` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_fieldblacklists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_fieldblacklists` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL DEFAULT '',
  `field` varchar(255) NOT NULL DEFAULT '',
  `value` varchar(255) NOT NULL DEFAULT '',
  `itemtype` varchar(255) NOT NULL DEFAULT '',
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_fieldblacklists` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_fieldblacklists` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_fieldunicities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_fieldunicities` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL DEFAULT '',
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `itemtype` varchar(255) NOT NULL DEFAULT '',
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `fields` text DEFAULT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT 0,
  `action_refuse` tinyint(4) NOT NULL DEFAULT 0,
  `action_notify` tinyint(4) NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `is_active` (`is_active`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC COMMENT='Stores field unicity criterias';
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_fieldunicities` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_fieldunicities` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_filesystems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_filesystems` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_filesystems` DISABLE KEYS */;
INSERT INTO `glpi_filesystems` VALUES
(1,'ext',NULL,NULL,NULL),
(2,'ext2',NULL,NULL,NULL),
(3,'ext3',NULL,NULL,NULL),
(4,'ext4',NULL,NULL,NULL),
(5,'FAT',NULL,NULL,NULL),
(6,'FAT32',NULL,NULL,NULL),
(7,'VFAT',NULL,NULL,NULL),
(8,'HFS',NULL,NULL,NULL),
(9,'HPFS',NULL,NULL,NULL),
(10,'HTFS',NULL,NULL,NULL),
(11,'JFS',NULL,NULL,NULL),
(12,'JFS2',NULL,NULL,NULL),
(13,'NFS',NULL,NULL,NULL),
(14,'NTFS',NULL,NULL,NULL),
(15,'ReiserFS',NULL,NULL,NULL),
(16,'SMBFS',NULL,NULL,NULL),
(17,'UDF',NULL,NULL,NULL),
(18,'UFS',NULL,NULL,NULL),
(19,'XFS',NULL,NULL,NULL),
(20,'ZFS',NULL,NULL,NULL),
(21,'APFS',NULL,NULL,NULL);
/*!40000 ALTER TABLE `glpi_filesystems` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_forms_accesscontrols_formaccesscontrols`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_forms_accesscontrols_formaccesscontrols` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `forms_forms_id` int(10) unsigned NOT NULL DEFAULT 0,
  `strategy` varchar(255) NOT NULL,
  `config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`config`)),
  `is_active` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`forms_forms_id`,`strategy`),
  KEY `is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_forms_accesscontrols_formaccesscontrols` DISABLE KEYS */;
INSERT INTO `glpi_forms_accesscontrols_formaccesscontrols` VALUES
(1,1,'Glpi\\Form\\AccessControl\\ControlType\\AllowList','{\"user_ids\":[\"all\"],\"group_ids\":[],\"profile_ids\":[]}',1),
(2,2,'Glpi\\Form\\AccessControl\\ControlType\\AllowList','{\"user_ids\":[\"all\"],\"group_ids\":[],\"profile_ids\":[]}',1);
/*!40000 ALTER TABLE `glpi_forms_accesscontrols_formaccesscontrols` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_forms_answerssets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_forms_answerssets` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `forms_forms_id` int(10) unsigned NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `name` varchar(255) NOT NULL DEFAULT '',
  `date_creation` timestamp NULL DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `index` int(11) NOT NULL DEFAULT 0,
  `answers` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'JSON - Answers for each questions of the parent form' CHECK (json_valid(`answers`)),
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_creation` (`date_creation`),
  KEY `date_mod` (`date_mod`),
  KEY `forms_forms_id` (`forms_forms_id`),
  KEY `users_id` (`users_id`),
  KEY `entities_id` (`entities_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_forms_answerssets` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_forms_answerssets` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_forms_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_forms_categories` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL DEFAULT '',
  `description` longtext DEFAULT NULL,
  `illustration` varchar(255) NOT NULL DEFAULT '',
  `forms_categories_id` int(10) unsigned NOT NULL DEFAULT 0,
  `completename` text DEFAULT NULL,
  `level` int(11) NOT NULL DEFAULT 0,
  `ancestors_cache` longtext DEFAULT NULL,
  `sons_cache` longtext DEFAULT NULL,
  `comment` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `level` (`level`),
  KEY `forms_categories_id` (`forms_categories_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_forms_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_forms_categories` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_forms_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_forms_comments` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL DEFAULT '',
  `forms_sections_id` int(10) unsigned NOT NULL DEFAULT 0,
  `forms_sections_uuid` varchar(255) NOT NULL DEFAULT '',
  `name` varchar(255) NOT NULL DEFAULT '',
  `description` longtext DEFAULT NULL,
  `vertical_rank` int(11) NOT NULL DEFAULT 0,
  `horizontal_rank` int(11) DEFAULT NULL,
  `visibility_strategy` varchar(30) NOT NULL DEFAULT '',
  `conditions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`conditions`)),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `name` (`name`),
  KEY `forms_sections_id` (`forms_sections_id`),
  KEY `forms_sections_uuid` (`forms_sections_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_forms_comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_forms_comments` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_forms_destinations_answerssets_formdestinationitems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_forms_destinations_answerssets_formdestinationitems` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `forms_answerssets_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(255) NOT NULL,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`forms_answerssets_id`,`itemtype`,`items_id`),
  KEY `item` (`itemtype`,`items_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_forms_destinations_answerssets_formdestinationitems` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_forms_destinations_answerssets_formdestinationitems` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_forms_destinations_formdestinations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_forms_destinations_formdestinations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `forms_forms_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'Extra configuration field(s) depending on the destination type' CHECK (json_valid(`config`)),
  `creation_strategy` varchar(30) NOT NULL DEFAULT '',
  `conditions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`conditions`)),
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `itemtype` (`itemtype`),
  KEY `forms_forms_id` (`forms_forms_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_forms_destinations_formdestinations` DISABLE KEYS */;
INSERT INTO `glpi_forms_destinations_formdestinations` VALUES
(1,1,'Glpi\\Form\\Destination\\FormDestinationTicket','Solicitud','{\"glpi-form-destination-commonitilfield-titlefield\":{\"value\":\"<span data-form-tag=\\\"true\\\" data-form-tag-value=\\\"6\\\" data-form-tag-provider=\\\"Glpi\\\\Form\\\\Tag\\\\AnswerTagProvider\\\" class=\\\"border-teal border-start border-3 bg-dark-lt\\\">#Respuesta: T\\u00edtulo<\\/span>\"},\"glpi-form-destination-commonitilfield-contentfield_auto\":false,\"glpi-form-destination-commonitilfield-contentfield\":{\"value\":\"<span data-form-tag=\\\"true\\\" data-form-tag-value=\\\"7\\\" data-form-tag-provider=\\\"Glpi\\\\Form\\\\Tag\\\\AnswerTagProvider\\\" class=\\\"border-teal border-start border-3 bg-dark-lt\\\">#Respuesta: Descripci\\u00f3n<\\/span>\"},\"glpi-form-destination-commonitilfield-requesttypefield\":{\"strategy\":\"specific_value\",\"specific_question_id\":null,\"specific_request_type\":1},\"glpi-form-destination-commonitilfield-observerfield\":{\"strategies\":[\"last_valid_answer\"],\"specific_itilactors_ids\":[],\"specific_question_ids\":[]},\"glpi-form-destination-commonitilfield-linkeditilobjectsfield\":{\"strategy_configs\":[{\"strategy\":null,\"linktype\":\"\",\"specific_destination_ids\":[],\"specific_question_ids\":[],\"specific_itilobject\":[]}]}}','','[]'),
(2,2,'Glpi\\Form\\Destination\\FormDestinationTicket','Solicitud','{\"glpi-form-destination-commonitilfield-titlefield\":{\"value\":\"<span data-form-tag=\\\"true\\\" data-form-tag-value=\\\"14\\\" data-form-tag-provider=\\\"Glpi\\\\Form\\\\Tag\\\\AnswerTagProvider\\\" class=\\\"border-teal border-start border-3 bg-dark-lt\\\">#Respuesta: T\\u00edtulo<\\/span>\"},\"glpi-form-destination-commonitilfield-contentfield_auto\":false,\"glpi-form-destination-commonitilfield-contentfield\":{\"value\":\"<span data-form-tag=\\\"true\\\" data-form-tag-value=\\\"15\\\" data-form-tag-provider=\\\"Glpi\\\\Form\\\\Tag\\\\AnswerTagProvider\\\" class=\\\"border-teal border-start border-3 bg-dark-lt\\\">#Respuesta: Descripci\\u00f3n<\\/span>\"},\"glpi-form-destination-commonitilfield-requesttypefield\":{\"strategy\":\"specific_value\",\"specific_question_id\":null,\"specific_request_type\":2},\"glpi-form-destination-commonitilfield-observerfield\":{\"strategies\":[\"last_valid_answer\"],\"specific_itilactors_ids\":[],\"specific_question_ids\":[]},\"glpi-form-destination-commonitilfield-linkeditilobjectsfield\":{\"strategy_configs\":[{\"strategy\":null,\"linktype\":\"\",\"specific_destination_ids\":[],\"specific_question_ids\":[],\"specific_itilobject\":[]}]}}','','[]');
/*!40000 ALTER TABLE `glpi_forms_destinations_formdestinations` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_forms_forms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_forms_forms` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL DEFAULT '',
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `is_active` tinyint(4) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_draft` tinyint(4) NOT NULL DEFAULT 0,
  `is_pinned` tinyint(4) NOT NULL DEFAULT 0,
  `render_layout` varchar(30) NOT NULL DEFAULT '',
  `name` varchar(255) NOT NULL DEFAULT '',
  `header` longtext DEFAULT NULL,
  `illustration` varchar(255) NOT NULL DEFAULT '',
  `description` longtext DEFAULT NULL,
  `forms_categories_id` int(10) unsigned NOT NULL DEFAULT 0,
  `usage_count` int(10) unsigned NOT NULL DEFAULT 0,
  `submit_button_visibility_strategy` varchar(30) NOT NULL DEFAULT '',
  `submit_button_conditions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`submit_button_conditions`)),
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `is_active` (`is_active`),
  KEY `is_deleted` (`is_deleted`),
  KEY `is_draft` (`is_draft`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `forms_categories_id` (`forms_categories_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_forms_forms` DISABLE KEYS */;
INSERT INTO `glpi_forms_forms` VALUES
(1,'fc3b1fc0-31a3-44b4-94bb-4bd570a1393b',0,1,1,0,0,0,'','Reportar un problema',NULL,'report-issue','Solicite ayuda a nuestro equipo de soporte técnico.',0,0,'','[]','2026-10-13 17:00:52','2026-10-13 17:00:52'),
(2,'e23af299-66f8-4178-97b5-3f15385a826b',0,1,1,0,0,0,'','Solicitar un servicio',NULL,'request-service','Solicite un servicio proporcionado por nuestro equipo.',0,0,'','[]','2026-10-13 17:00:52','2026-10-13 17:00:52');
/*!40000 ALTER TABLE `glpi_forms_forms` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_forms_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_forms_questions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL DEFAULT '',
  `forms_sections_id` int(10) unsigned NOT NULL DEFAULT 0,
  `forms_sections_uuid` varchar(255) NOT NULL DEFAULT '',
  `name` varchar(255) NOT NULL DEFAULT '',
  `type` varchar(255) NOT NULL DEFAULT '',
  `is_mandatory` tinyint(4) NOT NULL DEFAULT 0,
  `vertical_rank` int(11) NOT NULL DEFAULT 0,
  `horizontal_rank` int(11) DEFAULT NULL,
  `description` longtext DEFAULT NULL,
  `default_value` text DEFAULT NULL COMMENT 'JSON - The default value type may not be the same for all questions type',
  `extra_data` text DEFAULT NULL COMMENT 'JSON - Extra configuration field(s) depending on the questions type',
  `visibility_strategy` varchar(30) NOT NULL DEFAULT '',
  `conditions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`conditions`)),
  `validation_strategy` varchar(30) NOT NULL DEFAULT '',
  `validation_conditions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`validation_conditions`)),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `name` (`name`),
  KEY `forms_sections_id` (`forms_sections_id`),
  KEY `forms_sections_uuid` (`forms_sections_uuid`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_forms_questions` DISABLE KEYS */;
INSERT INTO `glpi_forms_questions` VALUES
(1,'b86c5919-8755-4c71-b56f-1061f182c2a2',1,'f048d17c-f2d1-43ae-85b3-5413ee3acbde','Urgencia','Glpi\\Form\\QuestionType\\QuestionTypeUrgency',0,0,NULL,NULL,NULL,NULL,'','[]','','[]'),
(2,'fe54ece7-94ba-4d91-961d-fbfd0d6551ad',1,'f048d17c-f2d1-43ae-85b3-5413ee3acbde','Categoría','Glpi\\Form\\QuestionType\\QuestionTypeItemDropdown',0,1,NULL,NULL,NULL,'{\"itemtype\":\"ITILCategory\",\"categories_filter\":[\"request\",\"incident\",\"change\",\"problem\"],\"root_items_id\":0,\"subtree_depth\":0,\"selectable_tree_root\":false}','','[]','','[]'),
(3,'ece38b73-45ce-4c7d-b3e2-8bdeded8dcaa',1,'f048d17c-f2d1-43ae-85b3-5413ee3acbde','Dispositivos del usuario','Glpi\\Form\\QuestionType\\QuestionTypeUserDevice',0,2,NULL,NULL,'0','{\"is_multiple_devices\":false}','','[]','','[]'),
(4,'8a553464-843c-4913-bfc6-5434916b36a1',1,'f048d17c-f2d1-43ae-85b3-5413ee3acbde','Observadores','Glpi\\Form\\QuestionType\\QuestionTypeObserver',0,3,NULL,NULL,NULL,'{\"is_multiple_actors\":true}','','[]','','[]'),
(5,'a832c4f3-32b0-443e-99d5-50e570405295',1,'f048d17c-f2d1-43ae-85b3-5413ee3acbde','Ubicaciones','Glpi\\Form\\QuestionType\\QuestionTypeItemDropdown',0,4,NULL,NULL,NULL,'{\"itemtype\":\"Location\",\"categories_filter\":[],\"root_items_id\":0,\"subtree_depth\":0,\"selectable_tree_root\":false}','','[]','','[]'),
(6,'e5a77579-4f9f-4d7b-8a79-1986202bc743',1,'f048d17c-f2d1-43ae-85b3-5413ee3acbde','Título','Glpi\\Form\\QuestionType\\QuestionTypeShortText',0,5,NULL,NULL,NULL,NULL,'','[]','','[]'),
(7,'8f9357c5-e7a2-40f5-8c58-e55450977f66',1,'f048d17c-f2d1-43ae-85b3-5413ee3acbde','Descripción','Glpi\\Form\\QuestionType\\QuestionTypeLongText',1,6,NULL,NULL,NULL,NULL,'','[]','','[]'),
(8,'bce633ea-f921-4717-a62a-c9f5ec5f793e',1,'f048d17c-f2d1-43ae-85b3-5413ee3acbde','Anexos','Glpi\\Form\\QuestionType\\QuestionTypeFile',0,7,NULL,NULL,NULL,NULL,'','[]','','[]'),
(9,'950f6f8e-79da-4c2c-bae6-6b9dfe976224',2,'2f57384b-0d72-4c37-a584-a899311072b5','Urgencia','Glpi\\Form\\QuestionType\\QuestionTypeUrgency',0,0,NULL,NULL,NULL,NULL,'','[]','','[]'),
(10,'d29a1190-8081-4555-9ddf-9d3ad629efc2',2,'2f57384b-0d72-4c37-a584-a899311072b5','Categoría','Glpi\\Form\\QuestionType\\QuestionTypeItemDropdown',0,1,NULL,NULL,NULL,'{\"itemtype\":\"ITILCategory\",\"categories_filter\":[\"request\",\"incident\",\"change\",\"problem\"],\"root_items_id\":0,\"subtree_depth\":0,\"selectable_tree_root\":false}','','[]','','[]'),
(11,'1e500c0d-f9d9-45fc-a966-9bf29aa38627',2,'2f57384b-0d72-4c37-a584-a899311072b5','Dispositivos del usuario','Glpi\\Form\\QuestionType\\QuestionTypeUserDevice',0,2,NULL,NULL,'0','{\"is_multiple_devices\":false}','','[]','','[]'),
(12,'afb0f5d3-4484-4a6d-b33f-83b59d03341e',2,'2f57384b-0d72-4c37-a584-a899311072b5','Observadores','Glpi\\Form\\QuestionType\\QuestionTypeObserver',0,3,NULL,NULL,NULL,'{\"is_multiple_actors\":true}','','[]','','[]'),
(13,'80f563b1-d3af-4813-86c8-77da76e2636d',2,'2f57384b-0d72-4c37-a584-a899311072b5','Ubicaciones','Glpi\\Form\\QuestionType\\QuestionTypeItemDropdown',0,4,NULL,NULL,NULL,'{\"itemtype\":\"Location\",\"categories_filter\":[],\"root_items_id\":0,\"subtree_depth\":0,\"selectable_tree_root\":false}','','[]','','[]'),
(14,'ac1bf51f-8ea5-49c9-8f0b-fb50bbc5b706',2,'2f57384b-0d72-4c37-a584-a899311072b5','Título','Glpi\\Form\\QuestionType\\QuestionTypeShortText',0,5,NULL,NULL,NULL,NULL,'','[]','','[]'),
(15,'037646e5-036c-420a-a79e-3bff2d2bcc4a',2,'2f57384b-0d72-4c37-a584-a899311072b5','Descripción','Glpi\\Form\\QuestionType\\QuestionTypeLongText',1,6,NULL,NULL,NULL,NULL,'','[]','','[]'),
(16,'052112f5-b2b2-4eda-83d7-811bea6db148',2,'2f57384b-0d72-4c37-a584-a899311072b5','Anexos','Glpi\\Form\\QuestionType\\QuestionTypeFile',0,7,NULL,NULL,NULL,NULL,'','[]','','[]');
/*!40000 ALTER TABLE `glpi_forms_questions` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_forms_sections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_forms_sections` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL DEFAULT '',
  `forms_forms_id` int(10) unsigned NOT NULL DEFAULT 0,
  `name` varchar(255) NOT NULL DEFAULT '',
  `description` longtext DEFAULT NULL,
  `rank` int(11) NOT NULL DEFAULT 0,
  `visibility_strategy` varchar(30) NOT NULL DEFAULT '',
  `conditions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`conditions`)),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `name` (`name`),
  KEY `forms_forms_id` (`forms_forms_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_forms_sections` DISABLE KEYS */;
INSERT INTO `glpi_forms_sections` VALUES
(1,'f048d17c-f2d1-43ae-85b3-5413ee3acbde',1,'Primera sección',NULL,0,'','[]'),
(2,'2f57384b-0d72-4c37-a584-a899311072b5',2,'Primera sección',NULL,0,'','[]');
/*!40000 ALTER TABLE `glpi_forms_sections` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_fqdns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_fqdns` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `fqdn` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `entities_id` (`entities_id`),
  KEY `name` (`name`),
  KEY `fqdn` (`fqdn`),
  KEY `is_recursive` (`is_recursive`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_fqdns` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_fqdns` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_groups` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `code` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `ldap_field` varchar(255) DEFAULT NULL,
  `ldap_value` text DEFAULT NULL,
  `ldap_group_dn` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `groups_id` int(10) unsigned NOT NULL DEFAULT 0,
  `completename` text DEFAULT NULL,
  `level` int(11) NOT NULL DEFAULT 0,
  `ancestors_cache` longtext DEFAULT NULL,
  `sons_cache` longtext DEFAULT NULL,
  `is_requester` tinyint(4) NOT NULL DEFAULT 1,
  `is_watcher` tinyint(4) NOT NULL DEFAULT 1,
  `is_assign` tinyint(4) NOT NULL DEFAULT 1,
  `is_task` tinyint(4) NOT NULL DEFAULT 1,
  `is_notify` tinyint(4) NOT NULL DEFAULT 1,
  `is_itemgroup` tinyint(4) NOT NULL DEFAULT 1,
  `is_usergroup` tinyint(4) NOT NULL DEFAULT 1,
  `is_manager` tinyint(4) NOT NULL DEFAULT 1,
  `date_creation` timestamp NULL DEFAULT NULL,
  `recursive_membership` tinyint(4) NOT NULL DEFAULT 0,
  `2fa_enforced` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `ldap_field` (`ldap_field`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `date_mod` (`date_mod`),
  KEY `ldap_value` (`ldap_value`(200)),
  KEY `ldap_group_dn` (`ldap_group_dn`(200)),
  KEY `groups_id` (`groups_id`),
  KEY `is_requester` (`is_requester`),
  KEY `is_watcher` (`is_watcher`),
  KEY `is_assign` (`is_assign`),
  KEY `is_notify` (`is_notify`),
  KEY `is_itemgroup` (`is_itemgroup`),
  KEY `is_usergroup` (`is_usergroup`),
  KEY `is_manager` (`is_manager`),
  KEY `date_creation` (`date_creation`),
  KEY `level` (`level`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_groups` DISABLE KEYS */;
INSERT INTO `glpi_groups` VALUES
(1,0,0,'Call Center',NULL,NULL,NULL,NULL,NULL,NULL,0,'Call Center',1,NULL,NULL,1,1,1,1,1,1,1,0,NULL,0,0),
(2,0,0,'Soporte Nivel 1',NULL,NULL,NULL,NULL,NULL,NULL,0,'Soporte Nivel 1',1,NULL,NULL,1,1,1,1,1,1,1,0,NULL,0,0);
/*!40000 ALTER TABLE `glpi_groups` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_groups_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_groups_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `groups_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(255) NOT NULL DEFAULT '',
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `type` tinyint(4) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`groups_id`,`itemtype`,`items_id`,`type`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_groups_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_groups_items` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_groups_knowbaseitems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_groups_knowbaseitems` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `knowbaseitems_id` int(10) unsigned NOT NULL DEFAULT 0,
  `groups_id` int(10) unsigned NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned DEFAULT NULL,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `no_entity_restriction` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `knowbaseitems_id` (`knowbaseitems_id`),
  KEY `groups_id` (`groups_id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_groups_knowbaseitems` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_groups_knowbaseitems` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_groups_problems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_groups_problems` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `problems_id` int(10) unsigned NOT NULL DEFAULT 0,
  `groups_id` int(10) unsigned NOT NULL DEFAULT 0,
  `type` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`problems_id`,`type`,`groups_id`),
  KEY `group` (`groups_id`,`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_groups_problems` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_groups_problems` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_groups_reminders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_groups_reminders` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `reminders_id` int(10) unsigned NOT NULL DEFAULT 0,
  `groups_id` int(10) unsigned NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned DEFAULT NULL,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `no_entity_restriction` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `reminders_id` (`reminders_id`),
  KEY `groups_id` (`groups_id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_groups_reminders` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_groups_reminders` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_groups_rssfeeds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_groups_rssfeeds` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `rssfeeds_id` int(10) unsigned NOT NULL DEFAULT 0,
  `groups_id` int(10) unsigned NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned DEFAULT NULL,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `no_entity_restriction` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `rssfeeds_id` (`rssfeeds_id`),
  KEY `groups_id` (`groups_id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_groups_rssfeeds` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_groups_rssfeeds` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_groups_tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_groups_tickets` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tickets_id` int(10) unsigned NOT NULL DEFAULT 0,
  `groups_id` int(10) unsigned NOT NULL DEFAULT 0,
  `type` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`tickets_id`,`type`,`groups_id`),
  KEY `group` (`groups_id`,`type`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_groups_tickets` DISABLE KEYS */;
INSERT INTO `glpi_groups_tickets` VALUES
(22,11,1,2),
(23,57,1,2),
(24,61,1,2),
(25,65,1,2),
(26,67,1,2),
(27,71,1,2),
(28,74,1,2),
(29,77,1,2);
/*!40000 ALTER TABLE `glpi_groups_tickets` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_groups_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_groups_users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `groups_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `is_manager` tinyint(4) NOT NULL DEFAULT 0,
  `is_userdelegate` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`users_id`,`groups_id`),
  KEY `groups_id` (`groups_id`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `is_manager` (`is_manager`),
  KEY `is_userdelegate` (`is_userdelegate`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_groups_users` DISABLE KEYS */;
INSERT INTO `glpi_groups_users` VALUES
(1,7,1,0,0,0);
/*!40000 ALTER TABLE `glpi_groups_users` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_helpdesks_tiles_externalpagetiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_helpdesks_tiles_externalpagetiles` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `illustration` varchar(255) DEFAULT NULL,
  `url` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_helpdesks_tiles_externalpagetiles` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_helpdesks_tiles_externalpagetiles` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_helpdesks_tiles_formtiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_helpdesks_tiles_formtiles` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `forms_forms_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `forms_forms_id` (`forms_forms_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_helpdesks_tiles_formtiles` DISABLE KEYS */;
INSERT INTO `glpi_helpdesks_tiles_formtiles` VALUES
(1,1),
(2,2);
/*!40000 ALTER TABLE `glpi_helpdesks_tiles_formtiles` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_helpdesks_tiles_glpipagetiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_helpdesks_tiles_glpipagetiles` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `illustration` varchar(255) DEFAULT NULL,
  `page` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_helpdesks_tiles_glpipagetiles` DISABLE KEYS */;
INSERT INTO `glpi_helpdesks_tiles_glpipagetiles` VALUES
(1,'Explorar artículos de ayuda','Ver todos los artículos de ayuda disponibles y nuestras preguntas frecuentes (FAQ).','browse-kb','faq'),
(2,'Crear una petición','Vaya a nuestro catálogo de servicios y seleccione un formulario para crear un nuevo ticket.','request-support','service_catalog'),
(3,'Ver sus tickets','Ver todos los tickets que ha creado.','tickets','tickets'),
(4,'Hacer una reserva','Seleccione un activo disponible y resérvelo para una fecha determinada.','reservation','reservation');
/*!40000 ALTER TABLE `glpi_helpdesks_tiles_glpipagetiles` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_helpdesks_tiles_items_tiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_helpdesks_tiles_items_tiles` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `itemtype_item` varchar(255) DEFAULT NULL,
  `items_id_item` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype_tile` varchar(255) DEFAULT NULL,
  `items_id_tile` int(10) unsigned NOT NULL DEFAULT 0,
  `rank` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`itemtype_item`,`items_id_item`,`rank`),
  UNIQUE KEY `item` (`itemtype_tile`,`items_id_tile`),
  KEY `rank` (`rank`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_helpdesks_tiles_items_tiles` DISABLE KEYS */;
INSERT INTO `glpi_helpdesks_tiles_items_tiles` VALUES
(1,'Entity',0,'Glpi\\Helpdesk\\Tile\\GlpiPageTile',1,1),
(2,'Entity',0,'Glpi\\Helpdesk\\Tile\\FormTile',1,2),
(3,'Entity',0,'Glpi\\Helpdesk\\Tile\\FormTile',2,3),
(4,'Entity',0,'Glpi\\Helpdesk\\Tile\\GlpiPageTile',2,4),
(5,'Entity',0,'Glpi\\Helpdesk\\Tile\\GlpiPageTile',3,5),
(6,'Entity',0,'Glpi\\Helpdesk\\Tile\\GlpiPageTile',4,6);
/*!40000 ALTER TABLE `glpi_helpdesks_tiles_items_tiles` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_holidays`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_holidays` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `begin_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `is_perpetual` tinyint(4) NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `begin_date` (`begin_date`),
  KEY `end_date` (`end_date`),
  KEY `is_perpetual` (`is_perpetual`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_holidays` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_holidays` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_imageformats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_imageformats` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_imageformats` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_imageformats` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_imageresolutions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_imageresolutions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `is_video` tinyint(4) NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `is_video` (`is_video`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_imageresolutions` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_imageresolutions` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_impactcompounds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_impactcompounds` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT '',
  `color` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_impactcompounds` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_impactcompounds` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_impactcontexts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_impactcontexts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `positions` mediumtext NOT NULL,
  `zoom` float NOT NULL DEFAULT 0,
  `pan_x` float NOT NULL DEFAULT 0,
  `pan_y` float NOT NULL DEFAULT 0,
  `impact_color` varchar(255) NOT NULL DEFAULT '',
  `depends_color` varchar(255) NOT NULL DEFAULT '',
  `impact_and_depends_color` varchar(255) NOT NULL DEFAULT '',
  `show_depends` tinyint(4) NOT NULL DEFAULT 1,
  `show_impact` tinyint(4) NOT NULL DEFAULT 1,
  `max_depth` int(11) NOT NULL DEFAULT 5,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_impactcontexts` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_impactcontexts` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_impactitems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_impactitems` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `itemtype` varchar(255) NOT NULL DEFAULT '',
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `parent_id` int(10) unsigned NOT NULL DEFAULT 0,
  `impactcontexts_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_slave` tinyint(4) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`itemtype`,`items_id`),
  KEY `source` (`itemtype`,`items_id`),
  KEY `parent_id` (`parent_id`),
  KEY `impactcontexts_id` (`impactcontexts_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_impactitems` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_impactitems` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_impactrelations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_impactrelations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL DEFAULT '',
  `itemtype_source` varchar(255) NOT NULL DEFAULT '',
  `items_id_source` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype_impacted` varchar(255) NOT NULL DEFAULT '',
  `items_id_impacted` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`itemtype_source`,`items_id_source`,`itemtype_impacted`,`items_id_impacted`),
  KEY `name` (`name`),
  KEY `impacted_asset` (`itemtype_impacted`,`items_id_impacted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_impactrelations` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_impactrelations` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_infocoms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_infocoms` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(100) NOT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `buy_date` date DEFAULT NULL,
  `use_date` date DEFAULT NULL,
  `warranty_duration` int(11) NOT NULL DEFAULT 0,
  `warranty_info` varchar(255) DEFAULT NULL,
  `suppliers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `order_number` varchar(255) DEFAULT NULL,
  `delivery_number` varchar(255) DEFAULT NULL,
  `immo_number` varchar(255) DEFAULT NULL,
  `value` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `warranty_value` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `sink_time` int(11) NOT NULL DEFAULT 0,
  `sink_type` int(11) NOT NULL DEFAULT 0,
  `sink_coeff` float NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `bill` varchar(255) DEFAULT NULL,
  `budgets_id` int(10) unsigned NOT NULL DEFAULT 0,
  `alert` int(11) NOT NULL DEFAULT 0,
  `order_date` date DEFAULT NULL,
  `delivery_date` date DEFAULT NULL,
  `inventory_date` date DEFAULT NULL,
  `warranty_date` date DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `decommission_date` timestamp NULL DEFAULT NULL,
  `businesscriticities_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`itemtype`,`items_id`),
  KEY `buy_date` (`buy_date`),
  KEY `alert` (`alert`),
  KEY `budgets_id` (`budgets_id`),
  KEY `suppliers_id` (`suppliers_id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `businesscriticities_id` (`businesscriticities_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_infocoms` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_infocoms` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_interfacetypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_interfacetypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_interfacetypes` DISABLE KEYS */;
INSERT INTO `glpi_interfacetypes` VALUES
(1,'IDE',NULL,NULL,NULL),
(2,'SATA',NULL,NULL,NULL),
(3,'SCSI',NULL,NULL,NULL),
(4,'USB',NULL,NULL,NULL),
(5,'AGP',NULL,NULL,NULL),
(6,'PCI',NULL,NULL,NULL),
(7,'PCIe',NULL,NULL,NULL),
(8,'PCI-X',NULL,NULL,NULL);
/*!40000 ALTER TABLE `glpi_interfacetypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_ipaddresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_ipaddresses` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(100) NOT NULL,
  `version` tinyint(3) unsigned DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `binary_0` int(10) unsigned NOT NULL DEFAULT 0,
  `binary_1` int(10) unsigned NOT NULL DEFAULT 0,
  `binary_2` int(10) unsigned NOT NULL DEFAULT 0,
  `binary_3` int(10) unsigned NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `mainitems_id` int(10) unsigned NOT NULL DEFAULT 0,
  `mainitemtype` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `binary` (`binary_0`,`binary_1`,`binary_2`,`binary_3`),
  KEY `is_deleted` (`is_deleted`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `item` (`itemtype`,`items_id`,`is_deleted`),
  KEY `mainitem` (`mainitemtype`,`mainitems_id`,`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_ipaddresses` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_ipaddresses` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_ipaddresses_ipnetworks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_ipaddresses_ipnetworks` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `ipaddresses_id` int(10) unsigned NOT NULL DEFAULT 0,
  `ipnetworks_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`ipaddresses_id`,`ipnetworks_id`),
  KEY `ipnetworks_id` (`ipnetworks_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_ipaddresses_ipnetworks` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_ipaddresses_ipnetworks` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_ipnetworks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_ipnetworks` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `ipnetworks_id` int(10) unsigned NOT NULL DEFAULT 0,
  `completename` text DEFAULT NULL,
  `level` int(11) NOT NULL DEFAULT 0,
  `ancestors_cache` longtext DEFAULT NULL,
  `sons_cache` longtext DEFAULT NULL,
  `addressable` tinyint(4) NOT NULL DEFAULT 0,
  `version` tinyint(3) unsigned DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `address` varchar(40) DEFAULT NULL,
  `address_0` int(10) unsigned NOT NULL DEFAULT 0,
  `address_1` int(10) unsigned NOT NULL DEFAULT 0,
  `address_2` int(10) unsigned NOT NULL DEFAULT 0,
  `address_3` int(10) unsigned NOT NULL DEFAULT 0,
  `netmask` varchar(40) DEFAULT NULL,
  `netmask_0` int(10) unsigned NOT NULL DEFAULT 0,
  `netmask_1` int(10) unsigned NOT NULL DEFAULT 0,
  `netmask_2` int(10) unsigned NOT NULL DEFAULT 0,
  `netmask_3` int(10) unsigned NOT NULL DEFAULT 0,
  `gateway` varchar(40) DEFAULT NULL,
  `gateway_0` int(10) unsigned NOT NULL DEFAULT 0,
  `gateway_1` int(10) unsigned NOT NULL DEFAULT 0,
  `gateway_2` int(10) unsigned NOT NULL DEFAULT 0,
  `gateway_3` int(10) unsigned NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `network_definition` (`entities_id`,`address`,`netmask`),
  KEY `address` (`address_0`,`address_1`,`address_2`,`address_3`),
  KEY `netmask` (`netmask_0`,`netmask_1`,`netmask_2`,`netmask_3`),
  KEY `gateway` (`gateway_0`,`gateway_1`,`gateway_2`,`gateway_3`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `ipnetworks_id` (`ipnetworks_id`),
  KEY `level` (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_ipnetworks` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_ipnetworks` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_ipnetworks_vlans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_ipnetworks_vlans` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `ipnetworks_id` int(10) unsigned NOT NULL DEFAULT 0,
  `vlans_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `link` (`ipnetworks_id`,`vlans_id`),
  KEY `vlans_id` (`vlans_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_ipnetworks_vlans` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_ipnetworks_vlans` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_itemantiviruses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_itemantiviruses` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `itemtype` varchar(255) DEFAULT NULL,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `manufacturers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `antivirus_version` varchar(255) DEFAULT NULL,
  `signature_version` varchar(255) DEFAULT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_uptodate` tinyint(4) NOT NULL DEFAULT 0,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `date_expiration` timestamp NULL DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `antivirus_version` (`antivirus_version`),
  KEY `signature_version` (`signature_version`),
  KEY `is_active` (`is_active`),
  KEY `is_uptodate` (`is_uptodate`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `is_deleted` (`is_deleted`),
  KEY `date_expiration` (`date_expiration`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `manufacturers_id` (`manufacturers_id`),
  KEY `item` (`itemtype`,`items_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_itemantiviruses` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_itemantiviruses` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_items_clusters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_items_clusters` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `clusters_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(100) DEFAULT NULL,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`clusters_id`,`itemtype`,`items_id`),
  KEY `item` (`itemtype`,`items_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_items_clusters` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_items_clusters` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_items_devicebatteries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_items_devicebatteries` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(255) DEFAULT NULL,
  `devicebatteries_id` int(10) unsigned NOT NULL DEFAULT 0,
  `manufacturing_date` date DEFAULT NULL,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `serial` varchar(255) DEFAULT NULL,
  `otherserial` varchar(255) DEFAULT NULL,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `states_id` int(10) unsigned NOT NULL DEFAULT 0,
  `real_capacity` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `devicebatteries_id` (`devicebatteries_id`),
  KEY `is_deleted` (`is_deleted`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `serial` (`serial`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `otherserial` (`otherserial`),
  KEY `locations_id` (`locations_id`),
  KEY `states_id` (`states_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_items_devicebatteries` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_items_devicebatteries` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_items_devicecameras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_items_devicecameras` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(255) DEFAULT NULL,
  `devicecameras_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `states_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `items_id` (`items_id`),
  KEY `devicecameras_id` (`devicecameras_id`),
  KEY `is_deleted` (`is_deleted`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `locations_id` (`locations_id`),
  KEY `states_id` (`states_id`),
  KEY `item` (`itemtype`,`items_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_items_devicecameras` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_items_devicecameras` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_items_devicecameras_imageformats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_items_devicecameras_imageformats` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `items_devicecameras_id` int(10) unsigned NOT NULL DEFAULT 0,
  `imageformats_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `items_devicecameras_id` (`items_devicecameras_id`),
  KEY `imageformats_id` (`imageformats_id`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `is_deleted` (`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_items_devicecameras_imageformats` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_items_devicecameras_imageformats` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_items_devicecameras_imageresolutions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_items_devicecameras_imageresolutions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `items_devicecameras_id` int(10) unsigned NOT NULL DEFAULT 0,
  `imageresolutions_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `items_devicecameras_id` (`items_devicecameras_id`),
  KEY `imageresolutions_id` (`imageresolutions_id`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `is_deleted` (`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_items_devicecameras_imageresolutions` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_items_devicecameras_imageresolutions` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_items_devicecases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_items_devicecases` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(255) DEFAULT NULL,
  `devicecases_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `serial` varchar(255) DEFAULT NULL,
  `otherserial` varchar(255) DEFAULT NULL,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `states_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `devicecases_id` (`devicecases_id`),
  KEY `is_deleted` (`is_deleted`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `serial` (`serial`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `otherserial` (`otherserial`),
  KEY `locations_id` (`locations_id`),
  KEY `states_id` (`states_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_items_devicecases` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_items_devicecases` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_items_devicecontrols`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_items_devicecontrols` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(255) DEFAULT NULL,
  `devicecontrols_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `serial` varchar(255) DEFAULT NULL,
  `busID` varchar(255) DEFAULT NULL,
  `otherserial` varchar(255) DEFAULT NULL,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `states_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `devicecontrols_id` (`devicecontrols_id`),
  KEY `is_deleted` (`is_deleted`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `serial` (`serial`),
  KEY `busID` (`busID`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `otherserial` (`otherserial`),
  KEY `locations_id` (`locations_id`),
  KEY `states_id` (`states_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_items_devicecontrols` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_items_devicecontrols` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_items_devicedrives`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_items_devicedrives` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(255) DEFAULT NULL,
  `devicedrives_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `serial` varchar(255) DEFAULT NULL,
  `busID` varchar(255) DEFAULT NULL,
  `otherserial` varchar(255) DEFAULT NULL,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `states_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `devicedrives_id` (`devicedrives_id`),
  KEY `is_deleted` (`is_deleted`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `serial` (`serial`),
  KEY `busID` (`busID`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `otherserial` (`otherserial`),
  KEY `locations_id` (`locations_id`),
  KEY `states_id` (`states_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_items_devicedrives` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_items_devicedrives` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_items_devicefirmwares`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_items_devicefirmwares` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(255) DEFAULT NULL,
  `devicefirmwares_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `serial` varchar(255) DEFAULT NULL,
  `otherserial` varchar(255) DEFAULT NULL,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `states_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `devicefirmwares_id` (`devicefirmwares_id`),
  KEY `is_deleted` (`is_deleted`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `serial` (`serial`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `otherserial` (`otherserial`),
  KEY `locations_id` (`locations_id`),
  KEY `states_id` (`states_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_items_devicefirmwares` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_items_devicefirmwares` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_items_devicegenerics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_items_devicegenerics` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(255) DEFAULT NULL,
  `devicegenerics_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `serial` varchar(255) DEFAULT NULL,
  `otherserial` varchar(255) DEFAULT NULL,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `states_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `devicegenerics_id` (`devicegenerics_id`),
  KEY `is_deleted` (`is_deleted`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `serial` (`serial`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `otherserial` (`otherserial`),
  KEY `locations_id` (`locations_id`),
  KEY `states_id` (`states_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_items_devicegenerics` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_items_devicegenerics` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_items_devicegraphiccards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_items_devicegraphiccards` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(255) DEFAULT NULL,
  `devicegraphiccards_id` int(10) unsigned NOT NULL DEFAULT 0,
  `memory` int(11) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `serial` varchar(255) DEFAULT NULL,
  `busID` varchar(255) DEFAULT NULL,
  `otherserial` varchar(255) DEFAULT NULL,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `states_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `devicegraphiccards_id` (`devicegraphiccards_id`),
  KEY `specificity` (`memory`),
  KEY `is_deleted` (`is_deleted`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `serial` (`serial`),
  KEY `busID` (`busID`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `otherserial` (`otherserial`),
  KEY `locations_id` (`locations_id`),
  KEY `states_id` (`states_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_items_devicegraphiccards` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_items_devicegraphiccards` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_items_deviceharddrives`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_items_deviceharddrives` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(255) DEFAULT NULL,
  `deviceharddrives_id` int(10) unsigned NOT NULL DEFAULT 0,
  `capacity` int(11) NOT NULL DEFAULT 0,
  `serial` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `busID` varchar(255) DEFAULT NULL,
  `otherserial` varchar(255) DEFAULT NULL,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `states_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `deviceharddrives_id` (`deviceharddrives_id`),
  KEY `specificity` (`capacity`),
  KEY `is_deleted` (`is_deleted`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `serial` (`serial`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `busID` (`busID`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `otherserial` (`otherserial`),
  KEY `locations_id` (`locations_id`),
  KEY `states_id` (`states_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_items_deviceharddrives` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_items_deviceharddrives` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_items_devicememories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_items_devicememories` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(255) DEFAULT NULL,
  `devicememories_id` int(10) unsigned NOT NULL DEFAULT 0,
  `size` int(11) NOT NULL DEFAULT 0,
  `serial` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `busID` varchar(255) DEFAULT NULL,
  `otherserial` varchar(255) DEFAULT NULL,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `states_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `devicememories_id` (`devicememories_id`),
  KEY `specificity` (`size`),
  KEY `is_deleted` (`is_deleted`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `serial` (`serial`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `busID` (`busID`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `otherserial` (`otherserial`),
  KEY `locations_id` (`locations_id`),
  KEY `states_id` (`states_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_items_devicememories` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_items_devicememories` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_items_devicemotherboards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_items_devicemotherboards` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(255) DEFAULT NULL,
  `devicemotherboards_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `serial` varchar(255) DEFAULT NULL,
  `otherserial` varchar(255) DEFAULT NULL,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `states_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `devicemotherboards_id` (`devicemotherboards_id`),
  KEY `is_deleted` (`is_deleted`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `serial` (`serial`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `otherserial` (`otherserial`),
  KEY `locations_id` (`locations_id`),
  KEY `states_id` (`states_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_items_devicemotherboards` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_items_devicemotherboards` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_items_devicenetworkcards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_items_devicenetworkcards` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(255) DEFAULT NULL,
  `devicenetworkcards_id` int(10) unsigned NOT NULL DEFAULT 0,
  `mac` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `serial` varchar(255) DEFAULT NULL,
  `busID` varchar(255) DEFAULT NULL,
  `otherserial` varchar(255) DEFAULT NULL,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `states_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `devicenetworkcards_id` (`devicenetworkcards_id`),
  KEY `specificity` (`mac`),
  KEY `is_deleted` (`is_deleted`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `serial` (`serial`),
  KEY `busID` (`busID`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `otherserial` (`otherserial`),
  KEY `locations_id` (`locations_id`),
  KEY `states_id` (`states_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_items_devicenetworkcards` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_items_devicenetworkcards` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_items_devicepcis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_items_devicepcis` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(255) DEFAULT NULL,
  `devicepcis_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `serial` varchar(255) DEFAULT NULL,
  `busID` varchar(255) DEFAULT NULL,
  `otherserial` varchar(255) DEFAULT NULL,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `states_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `devicepcis_id` (`devicepcis_id`),
  KEY `is_deleted` (`is_deleted`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `serial` (`serial`),
  KEY `busID` (`busID`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `otherserial` (`otherserial`),
  KEY `locations_id` (`locations_id`),
  KEY `states_id` (`states_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_items_devicepcis` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_items_devicepcis` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_items_devicepowersupplies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_items_devicepowersupplies` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(255) DEFAULT NULL,
  `devicepowersupplies_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `serial` varchar(255) DEFAULT NULL,
  `otherserial` varchar(255) DEFAULT NULL,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `states_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `devicepowersupplies_id` (`devicepowersupplies_id`),
  KEY `is_deleted` (`is_deleted`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `serial` (`serial`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `otherserial` (`otherserial`),
  KEY `locations_id` (`locations_id`),
  KEY `states_id` (`states_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_items_devicepowersupplies` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_items_devicepowersupplies` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_items_deviceprocessors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_items_deviceprocessors` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(255) DEFAULT NULL,
  `deviceprocessors_id` int(10) unsigned NOT NULL DEFAULT 0,
  `frequency` int(11) NOT NULL DEFAULT 0,
  `serial` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `nbcores` int(11) DEFAULT NULL,
  `nbthreads` int(11) DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `busID` varchar(255) DEFAULT NULL,
  `otherserial` varchar(255) DEFAULT NULL,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `states_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `deviceprocessors_id` (`deviceprocessors_id`),
  KEY `specificity` (`frequency`),
  KEY `is_deleted` (`is_deleted`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `serial` (`serial`),
  KEY `nbcores` (`nbcores`),
  KEY `nbthreads` (`nbthreads`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `busID` (`busID`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `otherserial` (`otherserial`),
  KEY `locations_id` (`locations_id`),
  KEY `states_id` (`states_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_items_deviceprocessors` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_items_deviceprocessors` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_items_devicesensors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_items_devicesensors` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(255) DEFAULT NULL,
  `devicesensors_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `serial` varchar(255) DEFAULT NULL,
  `otherserial` varchar(255) DEFAULT NULL,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `states_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `devicesensors_id` (`devicesensors_id`),
  KEY `is_deleted` (`is_deleted`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `serial` (`serial`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `otherserial` (`otherserial`),
  KEY `locations_id` (`locations_id`),
  KEY `states_id` (`states_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_items_devicesensors` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_items_devicesensors` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_items_devicesimcards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_items_devicesimcards` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(100) NOT NULL,
  `devicesimcards_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `serial` varchar(255) DEFAULT NULL,
  `otherserial` varchar(255) DEFAULT NULL,
  `states_id` int(10) unsigned NOT NULL DEFAULT 0,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `lines_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id_tech` int(10) unsigned NOT NULL DEFAULT 0,
  `pin` varchar(255) NOT NULL DEFAULT '',
  `pin2` varchar(255) NOT NULL DEFAULT '',
  `puk` varchar(255) NOT NULL DEFAULT '',
  `puk2` varchar(255) NOT NULL DEFAULT '',
  `msin` varchar(255) NOT NULL DEFAULT '',
  `comment` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `devicesimcards_id` (`devicesimcards_id`),
  KEY `is_deleted` (`is_deleted`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `serial` (`serial`),
  KEY `otherserial` (`otherserial`),
  KEY `states_id` (`states_id`),
  KEY `locations_id` (`locations_id`),
  KEY `lines_id` (`lines_id`),
  KEY `users_id` (`users_id`),
  KEY `users_id_tech` (`users_id_tech`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_items_devicesimcards` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_items_devicesimcards` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_items_devicesoundcards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_items_devicesoundcards` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(255) DEFAULT NULL,
  `devicesoundcards_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `serial` varchar(255) DEFAULT NULL,
  `busID` varchar(255) DEFAULT NULL,
  `otherserial` varchar(255) DEFAULT NULL,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `states_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `devicesoundcards_id` (`devicesoundcards_id`),
  KEY `is_deleted` (`is_deleted`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `serial` (`serial`),
  KEY `busID` (`busID`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `otherserial` (`otherserial`),
  KEY `locations_id` (`locations_id`),
  KEY `states_id` (`states_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_items_devicesoundcards` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_items_devicesoundcards` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_items_disks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_items_disks` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(255) DEFAULT NULL,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `device` varchar(255) DEFAULT NULL,
  `mountpoint` varchar(255) DEFAULT NULL,
  `filesystems_id` int(10) unsigned NOT NULL DEFAULT 0,
  `totalsize` bigint(20) NOT NULL DEFAULT 0,
  `freesize` bigint(20) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `encryption_status` int(11) NOT NULL DEFAULT 0,
  `encryption_tool` varchar(255) DEFAULT NULL,
  `encryption_algorithm` varchar(255) DEFAULT NULL,
  `encryption_type` varchar(255) DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `device` (`device`),
  KEY `mountpoint` (`mountpoint`),
  KEY `totalsize` (`totalsize`),
  KEY `freesize` (`freesize`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `filesystems_id` (`filesystems_id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_deleted` (`is_deleted`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_items_disks` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_items_disks` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_items_enclosures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_items_enclosures` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `enclosures_id` int(10) unsigned NOT NULL,
  `itemtype` varchar(255) NOT NULL,
  `items_id` int(10) unsigned NOT NULL,
  `position` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `item` (`itemtype`,`items_id`),
  KEY `relation` (`enclosures_id`,`itemtype`,`items_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_items_enclosures` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_items_enclosures` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_items_environments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_items_environments` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `itemtype` varchar(100) DEFAULT NULL,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `key` varchar(255) DEFAULT NULL,
  `value` text DEFAULT NULL,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `is_deleted` (`is_deleted`),
  KEY `is_dynamic` (`is_dynamic`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_items_environments` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_items_environments` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_items_kanbans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_items_kanbans` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `itemtype` varchar(100) NOT NULL,
  `items_id` int(10) unsigned DEFAULT NULL,
  `users_id` int(10) unsigned NOT NULL,
  `state` mediumtext DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`itemtype`,`items_id`,`users_id`),
  KEY `users_id` (`users_id`),
  KEY `date_creation` (`date_creation`),
  KEY `date_mod` (`date_mod`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_items_kanbans` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_items_kanbans` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_items_lines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_items_lines` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `lines_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(100) DEFAULT NULL,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`lines_id`,`itemtype`,`items_id`),
  KEY `item` (`itemtype`,`items_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_items_lines` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_items_lines` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_items_operatingsystems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_items_operatingsystems` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(255) DEFAULT NULL,
  `operatingsystems_id` int(10) unsigned NOT NULL DEFAULT 0,
  `operatingsystemversions_id` int(10) unsigned NOT NULL DEFAULT 0,
  `operatingsystemservicepacks_id` int(10) unsigned NOT NULL DEFAULT 0,
  `operatingsystemarchitectures_id` int(10) unsigned NOT NULL DEFAULT 0,
  `operatingsystemkernelversions_id` int(10) unsigned NOT NULL DEFAULT 0,
  `license_number` varchar(255) DEFAULT NULL,
  `licenseid` varchar(255) DEFAULT NULL,
  `company` varchar(255) DEFAULT NULL,
  `owner` varchar(255) DEFAULT NULL,
  `hostid` varchar(255) DEFAULT NULL,
  `operatingsystemeditions_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `install_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`items_id`,`itemtype`,`operatingsystems_id`,`operatingsystemarchitectures_id`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `operatingsystems_id` (`operatingsystems_id`),
  KEY `operatingsystemservicepacks_id` (`operatingsystemservicepacks_id`),
  KEY `operatingsystemversions_id` (`operatingsystemversions_id`),
  KEY `operatingsystemarchitectures_id` (`operatingsystemarchitectures_id`),
  KEY `operatingsystemkernelversions_id` (`operatingsystemkernelversions_id`),
  KEY `operatingsystemeditions_id` (`operatingsystemeditions_id`),
  KEY `is_deleted` (`is_deleted`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `date_creation` (`date_creation`),
  KEY `date_mod` (`date_mod`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_items_operatingsystems` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_items_operatingsystems` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_items_plugs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_items_plugs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `plugs_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(255) NOT NULL,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `number_plugs` int(11) DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `plugs_id` (`plugs_id`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `date_creation` (`date_creation`),
  KEY `date_mod` (`date_mod`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_items_plugs` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_items_plugs` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_items_problems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_items_problems` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `problems_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(100) DEFAULT NULL,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`problems_id`,`itemtype`,`items_id`),
  KEY `item` (`itemtype`,`items_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_items_problems` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_items_problems` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_items_processes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_items_processes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `itemtype` varchar(100) DEFAULT NULL,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `cmd` text DEFAULT NULL,
  `cpuusage` float NOT NULL DEFAULT 0,
  `memusage` float NOT NULL DEFAULT 0,
  `pid` int(11) NOT NULL DEFAULT 1,
  `started` timestamp NULL DEFAULT NULL,
  `tty` varchar(100) DEFAULT NULL,
  `user` varchar(100) DEFAULT NULL,
  `virtualmemory` bigint(20) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `is_deleted` (`is_deleted`),
  KEY `is_dynamic` (`is_dynamic`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_items_processes` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_items_processes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_items_projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_items_projects` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `projects_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(100) DEFAULT NULL,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`projects_id`,`itemtype`,`items_id`),
  KEY `item` (`itemtype`,`items_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_items_projects` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_items_projects` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_items_racks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_items_racks` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `racks_id` int(10) unsigned NOT NULL,
  `itemtype` varchar(255) NOT NULL,
  `items_id` int(10) unsigned NOT NULL,
  `position` int(11) NOT NULL,
  `orientation` tinyint(4) DEFAULT NULL,
  `bgcolor` varchar(7) DEFAULT NULL,
  `hpos` tinyint(4) NOT NULL DEFAULT 0,
  `is_reserved` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `item` (`itemtype`,`items_id`,`is_reserved`),
  KEY `relation` (`racks_id`,`itemtype`,`items_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_items_racks` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_items_racks` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_items_remotemanagements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_items_remotemanagements` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `itemtype` varchar(100) DEFAULT NULL,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `remoteid` varchar(255) DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `is_deleted` (`is_deleted`),
  KEY `item` (`itemtype`,`items_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_items_remotemanagements` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_items_remotemanagements` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_items_softwarelicenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_items_softwarelicenses` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(100) NOT NULL,
  `softwarelicenses_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `softwarelicenses_id` (`softwarelicenses_id`),
  KEY `is_deleted` (`is_deleted`),
  KEY `is_dynamic` (`is_dynamic`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_items_softwarelicenses` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_items_softwarelicenses` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_items_softwareversions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_items_softwareversions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(100) NOT NULL,
  `softwareversions_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_deleted_item` tinyint(4) NOT NULL DEFAULT 0,
  `is_template_item` tinyint(4) NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `date_install` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`itemtype`,`items_id`,`softwareversions_id`),
  KEY `softwareversions_id` (`softwareversions_id`),
  KEY `computers_info` (`entities_id`,`is_template_item`,`is_deleted_item`),
  KEY `is_deleted` (`is_deleted`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `is_deleted_item` (`is_deleted_item`),
  KEY `is_template_item` (`is_template_item`),
  KEY `date_install` (`date_install`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_items_softwareversions` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_items_softwareversions` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_items_ticketrecurrents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_items_ticketrecurrents` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `itemtype` varchar(255) DEFAULT NULL,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `ticketrecurrents_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`itemtype`,`items_id`,`ticketrecurrents_id`),
  KEY `items_id` (`items_id`),
  KEY `ticketrecurrents_id` (`ticketrecurrents_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_items_ticketrecurrents` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_items_ticketrecurrents` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_items_tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_items_tickets` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `itemtype` varchar(255) DEFAULT NULL,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `tickets_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`itemtype`,`items_id`,`tickets_id`),
  KEY `tickets_id` (`tickets_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_items_tickets` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_items_tickets` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_itemtranslations_itemtranslations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_itemtranslations_itemtranslations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(100) NOT NULL,
  `key` varchar(255) NOT NULL,
  `language` varchar(10) NOT NULL,
  `translations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`translations`)),
  `hash` varchar(32) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_item_key` (`items_id`,`itemtype`,`key`,`language`),
  KEY `item` (`itemtype`,`items_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1475 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_itemtranslations_itemtranslations` DISABLE KEYS */;
INSERT INTO `glpi_itemtranslations_itemtranslations` VALUES
(1,1,'Glpi\\Form\\Form','form_name','ar_SA','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(2,1,'Glpi\\Form\\Form','form_description','ar_SA','{}','2794669861cc00408fef842e5cf6930a'),
(3,1,'Glpi\\Form\\Question','question_name','ar_SA','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(4,2,'Glpi\\Form\\Question','question_name','ar_SA','{\"one\":\"\\u0641\\u0626\\u0629\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(5,3,'Glpi\\Form\\Question','question_name','ar_SA','{}','13fc108822413e5c9a9b177c353b8718'),
(6,4,'Glpi\\Form\\Question','question_name','ar_SA','{\"one\":\"\\u0645\\u0631\\u0627\\u0642\\u0628\\u0627\\u0646\"}','afee7117d982a452a8a772b513c58412'),
(7,5,'Glpi\\Form\\Question','question_name','ar_SA','{\"one\":\"\\u0645\\u0648\\u0642\\u0639\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(8,6,'Glpi\\Form\\Question','question_name','ar_SA','{}','09b79d379db0c82b4615d749b22475f0'),
(9,6,'Glpi\\Form\\Question','question_default_value','ar_SA','{}','d41d8cd98f00b204e9800998ecf8427e'),
(10,7,'Glpi\\Form\\Question','question_name','ar_SA','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(11,8,'Glpi\\Form\\Question','question_name','ar_SA','{}','270774c2dc685cc979a7d7a2426bf193'),
(12,2,'Glpi\\Form\\Form','form_name','ar_SA','{}','99d2310dc614498390a30da92a419eb2'),
(13,2,'Glpi\\Form\\Form','form_description','ar_SA','{}','fb1026f69a37a5b62523c53c03402d91'),
(14,9,'Glpi\\Form\\Question','question_name','ar_SA','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(15,10,'Glpi\\Form\\Question','question_name','ar_SA','{\"one\":\"\\u0641\\u0626\\u0629\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(16,11,'Glpi\\Form\\Question','question_name','ar_SA','{}','13fc108822413e5c9a9b177c353b8718'),
(17,12,'Glpi\\Form\\Question','question_name','ar_SA','{\"one\":\"\\u0645\\u0631\\u0627\\u0642\\u0628\\u0627\\u0646\"}','afee7117d982a452a8a772b513c58412'),
(18,13,'Glpi\\Form\\Question','question_name','ar_SA','{\"one\":\"\\u0645\\u0648\\u0642\\u0639\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(19,14,'Glpi\\Form\\Question','question_name','ar_SA','{}','09b79d379db0c82b4615d749b22475f0'),
(20,14,'Glpi\\Form\\Question','question_default_value','ar_SA','{}','d41d8cd98f00b204e9800998ecf8427e'),
(21,15,'Glpi\\Form\\Question','question_name','ar_SA','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(22,16,'Glpi\\Form\\Question','question_name','ar_SA','{}','270774c2dc685cc979a7d7a2426bf193'),
(23,1,'Glpi\\Form\\Form','form_name','ar_IQ','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(24,1,'Glpi\\Form\\Form','form_description','ar_IQ','{}','2794669861cc00408fef842e5cf6930a'),
(25,1,'Glpi\\Form\\Question','question_name','ar_IQ','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(26,2,'Glpi\\Form\\Question','question_name','ar_IQ','{\"one\":\"\\u0641\\u0626\\u0629\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(27,3,'Glpi\\Form\\Question','question_name','ar_IQ','{}','13fc108822413e5c9a9b177c353b8718'),
(28,4,'Glpi\\Form\\Question','question_name','ar_IQ','{\"one\":\"\\u0645\\u0631\\u0627\\u0642\\u0628\\u0627\\u0646\"}','afee7117d982a452a8a772b513c58412'),
(29,5,'Glpi\\Form\\Question','question_name','ar_IQ','{\"one\":\"\\u0645\\u0648\\u0642\\u0639\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(30,6,'Glpi\\Form\\Question','question_name','ar_IQ','{}','09b79d379db0c82b4615d749b22475f0'),
(31,6,'Glpi\\Form\\Question','question_default_value','ar_IQ','{}','d41d8cd98f00b204e9800998ecf8427e'),
(32,7,'Glpi\\Form\\Question','question_name','ar_IQ','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(33,8,'Glpi\\Form\\Question','question_name','ar_IQ','{}','270774c2dc685cc979a7d7a2426bf193'),
(34,2,'Glpi\\Form\\Form','form_name','ar_IQ','{}','99d2310dc614498390a30da92a419eb2'),
(35,2,'Glpi\\Form\\Form','form_description','ar_IQ','{}','fb1026f69a37a5b62523c53c03402d91'),
(36,9,'Glpi\\Form\\Question','question_name','ar_IQ','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(37,10,'Glpi\\Form\\Question','question_name','ar_IQ','{\"one\":\"\\u0641\\u0626\\u0629\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(38,11,'Glpi\\Form\\Question','question_name','ar_IQ','{}','13fc108822413e5c9a9b177c353b8718'),
(39,12,'Glpi\\Form\\Question','question_name','ar_IQ','{\"one\":\"\\u0645\\u0631\\u0627\\u0642\\u0628\\u0627\\u0646\"}','afee7117d982a452a8a772b513c58412'),
(40,13,'Glpi\\Form\\Question','question_name','ar_IQ','{\"one\":\"\\u0645\\u0648\\u0642\\u0639\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(41,14,'Glpi\\Form\\Question','question_name','ar_IQ','{}','09b79d379db0c82b4615d749b22475f0'),
(42,14,'Glpi\\Form\\Question','question_default_value','ar_IQ','{}','d41d8cd98f00b204e9800998ecf8427e'),
(43,15,'Glpi\\Form\\Question','question_name','ar_IQ','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(44,16,'Glpi\\Form\\Question','question_name','ar_IQ','{}','270774c2dc685cc979a7d7a2426bf193'),
(45,1,'Glpi\\Form\\Form','form_name','ar_SY','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(46,1,'Glpi\\Form\\Form','form_description','ar_SY','{}','2794669861cc00408fef842e5cf6930a'),
(47,1,'Glpi\\Form\\Question','question_name','ar_SY','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(48,2,'Glpi\\Form\\Question','question_name','ar_SY','{\"one\":\"Categories\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(49,3,'Glpi\\Form\\Question','question_name','ar_SY','{}','13fc108822413e5c9a9b177c353b8718'),
(50,4,'Glpi\\Form\\Question','question_name','ar_SY','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(51,5,'Glpi\\Form\\Question','question_name','ar_SY','{\"one\":\"\\u0645\\u0648\\u0642\\u0639\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(52,6,'Glpi\\Form\\Question','question_name','ar_SY','{}','09b79d379db0c82b4615d749b22475f0'),
(53,6,'Glpi\\Form\\Question','question_default_value','ar_SY','{}','d41d8cd98f00b204e9800998ecf8427e'),
(54,7,'Glpi\\Form\\Question','question_name','ar_SY','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(55,8,'Glpi\\Form\\Question','question_name','ar_SY','{}','270774c2dc685cc979a7d7a2426bf193'),
(56,2,'Glpi\\Form\\Form','form_name','ar_SY','{}','99d2310dc614498390a30da92a419eb2'),
(57,2,'Glpi\\Form\\Form','form_description','ar_SY','{}','fb1026f69a37a5b62523c53c03402d91'),
(58,9,'Glpi\\Form\\Question','question_name','ar_SY','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(59,10,'Glpi\\Form\\Question','question_name','ar_SY','{\"one\":\"Categories\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(60,11,'Glpi\\Form\\Question','question_name','ar_SY','{}','13fc108822413e5c9a9b177c353b8718'),
(61,12,'Glpi\\Form\\Question','question_name','ar_SY','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(62,13,'Glpi\\Form\\Question','question_name','ar_SY','{\"one\":\"\\u0645\\u0648\\u0642\\u0639\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(63,14,'Glpi\\Form\\Question','question_name','ar_SY','{}','09b79d379db0c82b4615d749b22475f0'),
(64,14,'Glpi\\Form\\Question','question_default_value','ar_SY','{}','d41d8cd98f00b204e9800998ecf8427e'),
(65,15,'Glpi\\Form\\Question','question_name','ar_SY','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(66,16,'Glpi\\Form\\Question','question_name','ar_SY','{}','270774c2dc685cc979a7d7a2426bf193'),
(67,1,'Glpi\\Form\\Form','form_name','az_AZ','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(68,1,'Glpi\\Form\\Form','form_description','az_AZ','{}','2794669861cc00408fef842e5cf6930a'),
(69,1,'Glpi\\Form\\Question','question_name','az_AZ','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(70,2,'Glpi\\Form\\Question','question_name','az_AZ','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(71,3,'Glpi\\Form\\Question','question_name','az_AZ','{}','13fc108822413e5c9a9b177c353b8718'),
(72,4,'Glpi\\Form\\Question','question_name','az_AZ','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(73,5,'Glpi\\Form\\Question','question_name','az_AZ','{\"one\":\"Yerl\\u0259\\u015fm\\u0259l\\u0259r\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(74,6,'Glpi\\Form\\Question','question_name','az_AZ','{}','09b79d379db0c82b4615d749b22475f0'),
(75,6,'Glpi\\Form\\Question','question_default_value','az_AZ','{}','d41d8cd98f00b204e9800998ecf8427e'),
(76,7,'Glpi\\Form\\Question','question_name','az_AZ','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(77,8,'Glpi\\Form\\Question','question_name','az_AZ','{}','270774c2dc685cc979a7d7a2426bf193'),
(78,2,'Glpi\\Form\\Form','form_name','az_AZ','{}','99d2310dc614498390a30da92a419eb2'),
(79,2,'Glpi\\Form\\Form','form_description','az_AZ','{}','fb1026f69a37a5b62523c53c03402d91'),
(80,9,'Glpi\\Form\\Question','question_name','az_AZ','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(81,10,'Glpi\\Form\\Question','question_name','az_AZ','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(82,11,'Glpi\\Form\\Question','question_name','az_AZ','{}','13fc108822413e5c9a9b177c353b8718'),
(83,12,'Glpi\\Form\\Question','question_name','az_AZ','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(84,13,'Glpi\\Form\\Question','question_name','az_AZ','{\"one\":\"Yerl\\u0259\\u015fm\\u0259l\\u0259r\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(85,14,'Glpi\\Form\\Question','question_name','az_AZ','{}','09b79d379db0c82b4615d749b22475f0'),
(86,14,'Glpi\\Form\\Question','question_default_value','az_AZ','{}','d41d8cd98f00b204e9800998ecf8427e'),
(87,15,'Glpi\\Form\\Question','question_name','az_AZ','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(88,16,'Glpi\\Form\\Question','question_name','az_AZ','{}','270774c2dc685cc979a7d7a2426bf193'),
(89,1,'Glpi\\Form\\Form','form_name','bg_BG','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(90,1,'Glpi\\Form\\Form','form_description','bg_BG','{}','2794669861cc00408fef842e5cf6930a'),
(91,1,'Glpi\\Form\\Question','question_name','bg_BG','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(92,2,'Glpi\\Form\\Question','question_name','bg_BG','{\"one\":\"\\u041a\\u0430\\u0442\\u0435\\u0433\\u043e\\u0440\\u0438\\u044f\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(93,3,'Glpi\\Form\\Question','question_name','bg_BG','{}','13fc108822413e5c9a9b177c353b8718'),
(94,4,'Glpi\\Form\\Question','question_name','bg_BG','{\"one\":\"\\u041d\\u0430\\u0431\\u043b\\u044e\\u0434\\u0430\\u0442\\u0435\\u043b\\u0438\"}','afee7117d982a452a8a772b513c58412'),
(95,5,'Glpi\\Form\\Question','question_name','bg_BG','{\"one\":\"\\u041c\\u0435\\u0441\\u0442\\u043e\\u043f\\u043e\\u043b\\u043e\\u0436\\u0435\\u043d\\u0438\\u044f\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(96,6,'Glpi\\Form\\Question','question_name','bg_BG','{}','09b79d379db0c82b4615d749b22475f0'),
(97,6,'Glpi\\Form\\Question','question_default_value','bg_BG','{}','d41d8cd98f00b204e9800998ecf8427e'),
(98,7,'Glpi\\Form\\Question','question_name','bg_BG','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(99,8,'Glpi\\Form\\Question','question_name','bg_BG','{}','270774c2dc685cc979a7d7a2426bf193'),
(100,2,'Glpi\\Form\\Form','form_name','bg_BG','{}','99d2310dc614498390a30da92a419eb2'),
(101,2,'Glpi\\Form\\Form','form_description','bg_BG','{}','fb1026f69a37a5b62523c53c03402d91'),
(102,9,'Glpi\\Form\\Question','question_name','bg_BG','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(103,10,'Glpi\\Form\\Question','question_name','bg_BG','{\"one\":\"\\u041a\\u0430\\u0442\\u0435\\u0433\\u043e\\u0440\\u0438\\u044f\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(104,11,'Glpi\\Form\\Question','question_name','bg_BG','{}','13fc108822413e5c9a9b177c353b8718'),
(105,12,'Glpi\\Form\\Question','question_name','bg_BG','{\"one\":\"\\u041d\\u0430\\u0431\\u043b\\u044e\\u0434\\u0430\\u0442\\u0435\\u043b\\u0438\"}','afee7117d982a452a8a772b513c58412'),
(106,13,'Glpi\\Form\\Question','question_name','bg_BG','{\"one\":\"\\u041c\\u0435\\u0441\\u0442\\u043e\\u043f\\u043e\\u043b\\u043e\\u0436\\u0435\\u043d\\u0438\\u044f\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(107,14,'Glpi\\Form\\Question','question_name','bg_BG','{}','09b79d379db0c82b4615d749b22475f0'),
(108,14,'Glpi\\Form\\Question','question_default_value','bg_BG','{}','d41d8cd98f00b204e9800998ecf8427e'),
(109,15,'Glpi\\Form\\Question','question_name','bg_BG','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(110,16,'Glpi\\Form\\Question','question_name','bg_BG','{}','270774c2dc685cc979a7d7a2426bf193'),
(111,1,'Glpi\\Form\\Form','form_name','bn_BD','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(112,1,'Glpi\\Form\\Form','form_description','bn_BD','{}','2794669861cc00408fef842e5cf6930a'),
(113,1,'Glpi\\Form\\Question','question_name','bn_BD','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(114,2,'Glpi\\Form\\Question','question_name','bn_BD','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(115,3,'Glpi\\Form\\Question','question_name','bn_BD','{}','13fc108822413e5c9a9b177c353b8718'),
(116,4,'Glpi\\Form\\Question','question_name','bn_BD','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(117,5,'Glpi\\Form\\Question','question_name','bn_BD','{\"one\":\"Location\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(118,6,'Glpi\\Form\\Question','question_name','bn_BD','{}','09b79d379db0c82b4615d749b22475f0'),
(119,6,'Glpi\\Form\\Question','question_default_value','bn_BD','{}','d41d8cd98f00b204e9800998ecf8427e'),
(120,7,'Glpi\\Form\\Question','question_name','bn_BD','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(121,8,'Glpi\\Form\\Question','question_name','bn_BD','{}','270774c2dc685cc979a7d7a2426bf193'),
(122,2,'Glpi\\Form\\Form','form_name','bn_BD','{}','99d2310dc614498390a30da92a419eb2'),
(123,2,'Glpi\\Form\\Form','form_description','bn_BD','{}','fb1026f69a37a5b62523c53c03402d91'),
(124,9,'Glpi\\Form\\Question','question_name','bn_BD','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(125,10,'Glpi\\Form\\Question','question_name','bn_BD','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(126,11,'Glpi\\Form\\Question','question_name','bn_BD','{}','13fc108822413e5c9a9b177c353b8718'),
(127,12,'Glpi\\Form\\Question','question_name','bn_BD','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(128,13,'Glpi\\Form\\Question','question_name','bn_BD','{\"one\":\"Location\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(129,14,'Glpi\\Form\\Question','question_name','bn_BD','{}','09b79d379db0c82b4615d749b22475f0'),
(130,14,'Glpi\\Form\\Question','question_default_value','bn_BD','{}','d41d8cd98f00b204e9800998ecf8427e'),
(131,15,'Glpi\\Form\\Question','question_name','bn_BD','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(132,16,'Glpi\\Form\\Question','question_name','bn_BD','{}','270774c2dc685cc979a7d7a2426bf193'),
(133,1,'Glpi\\Form\\Form','form_name','id_ID','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(134,1,'Glpi\\Form\\Form','form_description','id_ID','{}','2794669861cc00408fef842e5cf6930a'),
(135,1,'Glpi\\Form\\Question','question_name','id_ID','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(136,2,'Glpi\\Form\\Question','question_name','id_ID','{\"one\":\"Kategori\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(137,3,'Glpi\\Form\\Question','question_name','id_ID','{}','13fc108822413e5c9a9b177c353b8718'),
(138,4,'Glpi\\Form\\Question','question_name','id_ID','{\"one\":\"Observer\"}','afee7117d982a452a8a772b513c58412'),
(139,5,'Glpi\\Form\\Question','question_name','id_ID','{\"one\":\"Lokasi\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(140,6,'Glpi\\Form\\Question','question_name','id_ID','{}','09b79d379db0c82b4615d749b22475f0'),
(141,6,'Glpi\\Form\\Question','question_default_value','id_ID','{}','d41d8cd98f00b204e9800998ecf8427e'),
(142,7,'Glpi\\Form\\Question','question_name','id_ID','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(143,8,'Glpi\\Form\\Question','question_name','id_ID','{}','270774c2dc685cc979a7d7a2426bf193'),
(144,2,'Glpi\\Form\\Form','form_name','id_ID','{}','99d2310dc614498390a30da92a419eb2'),
(145,2,'Glpi\\Form\\Form','form_description','id_ID','{}','fb1026f69a37a5b62523c53c03402d91'),
(146,9,'Glpi\\Form\\Question','question_name','id_ID','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(147,10,'Glpi\\Form\\Question','question_name','id_ID','{\"one\":\"Kategori\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(148,11,'Glpi\\Form\\Question','question_name','id_ID','{}','13fc108822413e5c9a9b177c353b8718'),
(149,12,'Glpi\\Form\\Question','question_name','id_ID','{\"one\":\"Observer\"}','afee7117d982a452a8a772b513c58412'),
(150,13,'Glpi\\Form\\Question','question_name','id_ID','{\"one\":\"Lokasi\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(151,14,'Glpi\\Form\\Question','question_name','id_ID','{}','09b79d379db0c82b4615d749b22475f0'),
(152,14,'Glpi\\Form\\Question','question_default_value','id_ID','{}','d41d8cd98f00b204e9800998ecf8427e'),
(153,15,'Glpi\\Form\\Question','question_name','id_ID','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(154,16,'Glpi\\Form\\Question','question_name','id_ID','{}','270774c2dc685cc979a7d7a2426bf193'),
(155,1,'Glpi\\Form\\Form','form_name','ms_MY','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(156,1,'Glpi\\Form\\Form','form_description','ms_MY','{}','2794669861cc00408fef842e5cf6930a'),
(157,1,'Glpi\\Form\\Question','question_name','ms_MY','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(158,2,'Glpi\\Form\\Question','question_name','ms_MY','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(159,3,'Glpi\\Form\\Question','question_name','ms_MY','{}','13fc108822413e5c9a9b177c353b8718'),
(160,4,'Glpi\\Form\\Question','question_name','ms_MY','{\"one\":\"Observer\"}','afee7117d982a452a8a772b513c58412'),
(161,5,'Glpi\\Form\\Question','question_name','ms_MY','{\"one\":\"Lokasi\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(162,6,'Glpi\\Form\\Question','question_name','ms_MY','{}','09b79d379db0c82b4615d749b22475f0'),
(163,6,'Glpi\\Form\\Question','question_default_value','ms_MY','{}','d41d8cd98f00b204e9800998ecf8427e'),
(164,7,'Glpi\\Form\\Question','question_name','ms_MY','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(165,8,'Glpi\\Form\\Question','question_name','ms_MY','{}','270774c2dc685cc979a7d7a2426bf193'),
(166,2,'Glpi\\Form\\Form','form_name','ms_MY','{}','99d2310dc614498390a30da92a419eb2'),
(167,2,'Glpi\\Form\\Form','form_description','ms_MY','{}','fb1026f69a37a5b62523c53c03402d91'),
(168,9,'Glpi\\Form\\Question','question_name','ms_MY','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(169,10,'Glpi\\Form\\Question','question_name','ms_MY','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(170,11,'Glpi\\Form\\Question','question_name','ms_MY','{}','13fc108822413e5c9a9b177c353b8718'),
(171,12,'Glpi\\Form\\Question','question_name','ms_MY','{\"one\":\"Observer\"}','afee7117d982a452a8a772b513c58412'),
(172,13,'Glpi\\Form\\Question','question_name','ms_MY','{\"one\":\"Lokasi\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(173,14,'Glpi\\Form\\Question','question_name','ms_MY','{}','09b79d379db0c82b4615d749b22475f0'),
(174,14,'Glpi\\Form\\Question','question_default_value','ms_MY','{}','d41d8cd98f00b204e9800998ecf8427e'),
(175,15,'Glpi\\Form\\Question','question_name','ms_MY','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(176,16,'Glpi\\Form\\Question','question_name','ms_MY','{}','270774c2dc685cc979a7d7a2426bf193'),
(177,1,'Glpi\\Form\\Form','form_name','ca_ES','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(178,1,'Glpi\\Form\\Form','form_description','ca_ES','{}','2794669861cc00408fef842e5cf6930a'),
(179,1,'Glpi\\Form\\Question','question_name','ca_ES','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(180,2,'Glpi\\Form\\Question','question_name','ca_ES','{\"one\":\"Categoria\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(181,3,'Glpi\\Form\\Question','question_name','ca_ES','{}','13fc108822413e5c9a9b177c353b8718'),
(182,4,'Glpi\\Form\\Question','question_name','ca_ES','{\"one\":\"Observadors\"}','afee7117d982a452a8a772b513c58412'),
(183,5,'Glpi\\Form\\Question','question_name','ca_ES','{\"one\":\"Ubicaci\\u00f3\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(184,6,'Glpi\\Form\\Question','question_name','ca_ES','{}','09b79d379db0c82b4615d749b22475f0'),
(185,6,'Glpi\\Form\\Question','question_default_value','ca_ES','{}','d41d8cd98f00b204e9800998ecf8427e'),
(186,7,'Glpi\\Form\\Question','question_name','ca_ES','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(187,8,'Glpi\\Form\\Question','question_name','ca_ES','{}','270774c2dc685cc979a7d7a2426bf193'),
(188,2,'Glpi\\Form\\Form','form_name','ca_ES','{}','99d2310dc614498390a30da92a419eb2'),
(189,2,'Glpi\\Form\\Form','form_description','ca_ES','{}','fb1026f69a37a5b62523c53c03402d91'),
(190,9,'Glpi\\Form\\Question','question_name','ca_ES','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(191,10,'Glpi\\Form\\Question','question_name','ca_ES','{\"one\":\"Categoria\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(192,11,'Glpi\\Form\\Question','question_name','ca_ES','{}','13fc108822413e5c9a9b177c353b8718'),
(193,12,'Glpi\\Form\\Question','question_name','ca_ES','{\"one\":\"Observadors\"}','afee7117d982a452a8a772b513c58412'),
(194,13,'Glpi\\Form\\Question','question_name','ca_ES','{\"one\":\"Ubicaci\\u00f3\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(195,14,'Glpi\\Form\\Question','question_name','ca_ES','{}','09b79d379db0c82b4615d749b22475f0'),
(196,14,'Glpi\\Form\\Question','question_default_value','ca_ES','{}','d41d8cd98f00b204e9800998ecf8427e'),
(197,15,'Glpi\\Form\\Question','question_name','ca_ES','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(198,16,'Glpi\\Form\\Question','question_name','ca_ES','{}','270774c2dc685cc979a7d7a2426bf193'),
(199,1,'Glpi\\Form\\Form','form_name','cs_CZ','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(200,1,'Glpi\\Form\\Form','form_description','cs_CZ','{}','2794669861cc00408fef842e5cf6930a'),
(201,1,'Glpi\\Form\\Question','question_name','cs_CZ','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(202,2,'Glpi\\Form\\Question','question_name','cs_CZ','{\"one\":\"Kategorie\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(203,3,'Glpi\\Form\\Question','question_name','cs_CZ','{}','13fc108822413e5c9a9b177c353b8718'),
(204,4,'Glpi\\Form\\Question','question_name','cs_CZ','{\"one\":\"Pozorovatel\\u016f\"}','afee7117d982a452a8a772b513c58412'),
(205,5,'Glpi\\Form\\Question','question_name','cs_CZ','{\"one\":\"Um\\u00edst\\u011bn\\u00ed\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(206,6,'Glpi\\Form\\Question','question_name','cs_CZ','{}','09b79d379db0c82b4615d749b22475f0'),
(207,6,'Glpi\\Form\\Question','question_default_value','cs_CZ','{}','d41d8cd98f00b204e9800998ecf8427e'),
(208,7,'Glpi\\Form\\Question','question_name','cs_CZ','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(209,8,'Glpi\\Form\\Question','question_name','cs_CZ','{}','270774c2dc685cc979a7d7a2426bf193'),
(210,2,'Glpi\\Form\\Form','form_name','cs_CZ','{}','99d2310dc614498390a30da92a419eb2'),
(211,2,'Glpi\\Form\\Form','form_description','cs_CZ','{}','fb1026f69a37a5b62523c53c03402d91'),
(212,9,'Glpi\\Form\\Question','question_name','cs_CZ','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(213,10,'Glpi\\Form\\Question','question_name','cs_CZ','{\"one\":\"Kategorie\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(214,11,'Glpi\\Form\\Question','question_name','cs_CZ','{}','13fc108822413e5c9a9b177c353b8718'),
(215,12,'Glpi\\Form\\Question','question_name','cs_CZ','{\"one\":\"Pozorovatel\\u016f\"}','afee7117d982a452a8a772b513c58412'),
(216,13,'Glpi\\Form\\Question','question_name','cs_CZ','{\"one\":\"Um\\u00edst\\u011bn\\u00ed\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(217,14,'Glpi\\Form\\Question','question_name','cs_CZ','{}','09b79d379db0c82b4615d749b22475f0'),
(218,14,'Glpi\\Form\\Question','question_default_value','cs_CZ','{}','d41d8cd98f00b204e9800998ecf8427e'),
(219,15,'Glpi\\Form\\Question','question_name','cs_CZ','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(220,16,'Glpi\\Form\\Question','question_name','cs_CZ','{}','270774c2dc685cc979a7d7a2426bf193'),
(221,1,'Glpi\\Form\\Form','form_name','de_DE','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(222,1,'Glpi\\Form\\Form','form_description','de_DE','{}','2794669861cc00408fef842e5cf6930a'),
(223,1,'Glpi\\Form\\Question','question_name','de_DE','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(224,2,'Glpi\\Form\\Question','question_name','de_DE','{\"one\":\"Kategorie\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(225,3,'Glpi\\Form\\Question','question_name','de_DE','{}','13fc108822413e5c9a9b177c353b8718'),
(226,4,'Glpi\\Form\\Question','question_name','de_DE','{\"one\":\"Beobachter\"}','afee7117d982a452a8a772b513c58412'),
(227,5,'Glpi\\Form\\Question','question_name','de_DE','{\"one\":\"Standort\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(228,6,'Glpi\\Form\\Question','question_name','de_DE','{}','09b79d379db0c82b4615d749b22475f0'),
(229,6,'Glpi\\Form\\Question','question_default_value','de_DE','{}','d41d8cd98f00b204e9800998ecf8427e'),
(230,7,'Glpi\\Form\\Question','question_name','de_DE','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(231,8,'Glpi\\Form\\Question','question_name','de_DE','{}','270774c2dc685cc979a7d7a2426bf193'),
(232,2,'Glpi\\Form\\Form','form_name','de_DE','{}','99d2310dc614498390a30da92a419eb2'),
(233,2,'Glpi\\Form\\Form','form_description','de_DE','{}','fb1026f69a37a5b62523c53c03402d91'),
(234,9,'Glpi\\Form\\Question','question_name','de_DE','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(235,10,'Glpi\\Form\\Question','question_name','de_DE','{\"one\":\"Kategorie\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(236,11,'Glpi\\Form\\Question','question_name','de_DE','{}','13fc108822413e5c9a9b177c353b8718'),
(237,12,'Glpi\\Form\\Question','question_name','de_DE','{\"one\":\"Beobachter\"}','afee7117d982a452a8a772b513c58412'),
(238,13,'Glpi\\Form\\Question','question_name','de_DE','{\"one\":\"Standort\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(239,14,'Glpi\\Form\\Question','question_name','de_DE','{}','09b79d379db0c82b4615d749b22475f0'),
(240,14,'Glpi\\Form\\Question','question_default_value','de_DE','{}','d41d8cd98f00b204e9800998ecf8427e'),
(241,15,'Glpi\\Form\\Question','question_name','de_DE','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(242,16,'Glpi\\Form\\Question','question_name','de_DE','{}','270774c2dc685cc979a7d7a2426bf193'),
(243,1,'Glpi\\Form\\Form','form_name','da_DK','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(244,1,'Glpi\\Form\\Form','form_description','da_DK','{}','2794669861cc00408fef842e5cf6930a'),
(245,1,'Glpi\\Form\\Question','question_name','da_DK','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(246,2,'Glpi\\Form\\Question','question_name','da_DK','{\"one\":\"Kategori\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(247,3,'Glpi\\Form\\Question','question_name','da_DK','{}','13fc108822413e5c9a9b177c353b8718'),
(248,4,'Glpi\\Form\\Question','question_name','da_DK','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(249,5,'Glpi\\Form\\Question','question_name','da_DK','{\"one\":\"Lokation\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(250,6,'Glpi\\Form\\Question','question_name','da_DK','{}','09b79d379db0c82b4615d749b22475f0'),
(251,6,'Glpi\\Form\\Question','question_default_value','da_DK','{}','d41d8cd98f00b204e9800998ecf8427e'),
(252,7,'Glpi\\Form\\Question','question_name','da_DK','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(253,8,'Glpi\\Form\\Question','question_name','da_DK','{}','270774c2dc685cc979a7d7a2426bf193'),
(254,2,'Glpi\\Form\\Form','form_name','da_DK','{}','99d2310dc614498390a30da92a419eb2'),
(255,2,'Glpi\\Form\\Form','form_description','da_DK','{}','fb1026f69a37a5b62523c53c03402d91'),
(256,9,'Glpi\\Form\\Question','question_name','da_DK','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(257,10,'Glpi\\Form\\Question','question_name','da_DK','{\"one\":\"Kategori\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(258,11,'Glpi\\Form\\Question','question_name','da_DK','{}','13fc108822413e5c9a9b177c353b8718'),
(259,12,'Glpi\\Form\\Question','question_name','da_DK','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(260,13,'Glpi\\Form\\Question','question_name','da_DK','{\"one\":\"Lokation\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(261,14,'Glpi\\Form\\Question','question_name','da_DK','{}','09b79d379db0c82b4615d749b22475f0'),
(262,14,'Glpi\\Form\\Question','question_default_value','da_DK','{}','d41d8cd98f00b204e9800998ecf8427e'),
(263,15,'Glpi\\Form\\Question','question_name','da_DK','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(264,16,'Glpi\\Form\\Question','question_name','da_DK','{}','270774c2dc685cc979a7d7a2426bf193'),
(265,1,'Glpi\\Form\\Form','form_name','et_EE','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(266,1,'Glpi\\Form\\Form','form_description','et_EE','{}','2794669861cc00408fef842e5cf6930a'),
(267,1,'Glpi\\Form\\Question','question_name','et_EE','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(268,2,'Glpi\\Form\\Question','question_name','et_EE','{\"one\":\"Valdkond\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(269,3,'Glpi\\Form\\Question','question_name','et_EE','{}','13fc108822413e5c9a9b177c353b8718'),
(270,4,'Glpi\\Form\\Question','question_name','et_EE','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(271,5,'Glpi\\Form\\Question','question_name','et_EE','{\"one\":\"Asukohad\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(272,6,'Glpi\\Form\\Question','question_name','et_EE','{}','09b79d379db0c82b4615d749b22475f0'),
(273,6,'Glpi\\Form\\Question','question_default_value','et_EE','{}','d41d8cd98f00b204e9800998ecf8427e'),
(274,7,'Glpi\\Form\\Question','question_name','et_EE','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(275,8,'Glpi\\Form\\Question','question_name','et_EE','{}','270774c2dc685cc979a7d7a2426bf193'),
(276,2,'Glpi\\Form\\Form','form_name','et_EE','{}','99d2310dc614498390a30da92a419eb2'),
(277,2,'Glpi\\Form\\Form','form_description','et_EE','{}','fb1026f69a37a5b62523c53c03402d91'),
(278,9,'Glpi\\Form\\Question','question_name','et_EE','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(279,10,'Glpi\\Form\\Question','question_name','et_EE','{\"one\":\"Valdkond\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(280,11,'Glpi\\Form\\Question','question_name','et_EE','{}','13fc108822413e5c9a9b177c353b8718'),
(281,12,'Glpi\\Form\\Question','question_name','et_EE','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(282,13,'Glpi\\Form\\Question','question_name','et_EE','{\"one\":\"Asukohad\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(283,14,'Glpi\\Form\\Question','question_name','et_EE','{}','09b79d379db0c82b4615d749b22475f0'),
(284,14,'Glpi\\Form\\Question','question_default_value','et_EE','{}','d41d8cd98f00b204e9800998ecf8427e'),
(285,15,'Glpi\\Form\\Question','question_name','et_EE','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(286,16,'Glpi\\Form\\Question','question_name','et_EE','{}','270774c2dc685cc979a7d7a2426bf193'),
(287,1,'Glpi\\Form\\Form','form_name','en_GB','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(288,1,'Glpi\\Form\\Form','form_description','en_GB','{}','2794669861cc00408fef842e5cf6930a'),
(289,1,'Glpi\\Form\\Question','question_name','en_GB','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(290,2,'Glpi\\Form\\Question','question_name','en_GB','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(291,3,'Glpi\\Form\\Question','question_name','en_GB','{}','13fc108822413e5c9a9b177c353b8718'),
(292,4,'Glpi\\Form\\Question','question_name','en_GB','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(293,5,'Glpi\\Form\\Question','question_name','en_GB','{\"one\":\"Location\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(294,6,'Glpi\\Form\\Question','question_name','en_GB','{}','09b79d379db0c82b4615d749b22475f0'),
(295,6,'Glpi\\Form\\Question','question_default_value','en_GB','{}','d41d8cd98f00b204e9800998ecf8427e'),
(296,7,'Glpi\\Form\\Question','question_name','en_GB','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(297,8,'Glpi\\Form\\Question','question_name','en_GB','{}','270774c2dc685cc979a7d7a2426bf193'),
(298,2,'Glpi\\Form\\Form','form_name','en_GB','{}','99d2310dc614498390a30da92a419eb2'),
(299,2,'Glpi\\Form\\Form','form_description','en_GB','{}','fb1026f69a37a5b62523c53c03402d91'),
(300,9,'Glpi\\Form\\Question','question_name','en_GB','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(301,10,'Glpi\\Form\\Question','question_name','en_GB','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(302,11,'Glpi\\Form\\Question','question_name','en_GB','{}','13fc108822413e5c9a9b177c353b8718'),
(303,12,'Glpi\\Form\\Question','question_name','en_GB','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(304,13,'Glpi\\Form\\Question','question_name','en_GB','{\"one\":\"Location\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(305,14,'Glpi\\Form\\Question','question_name','en_GB','{}','09b79d379db0c82b4615d749b22475f0'),
(306,14,'Glpi\\Form\\Question','question_default_value','en_GB','{}','d41d8cd98f00b204e9800998ecf8427e'),
(307,15,'Glpi\\Form\\Question','question_name','en_GB','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(308,16,'Glpi\\Form\\Question','question_name','en_GB','{}','270774c2dc685cc979a7d7a2426bf193'),
(309,1,'Glpi\\Form\\Form','form_name','en_US','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(310,1,'Glpi\\Form\\Form','form_description','en_US','{}','2794669861cc00408fef842e5cf6930a'),
(311,1,'Glpi\\Form\\Question','question_name','en_US','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(312,2,'Glpi\\Form\\Question','question_name','en_US','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(313,3,'Glpi\\Form\\Question','question_name','en_US','{}','13fc108822413e5c9a9b177c353b8718'),
(314,4,'Glpi\\Form\\Question','question_name','en_US','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(315,5,'Glpi\\Form\\Question','question_name','en_US','{\"one\":\"Location\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(316,6,'Glpi\\Form\\Question','question_name','en_US','{}','09b79d379db0c82b4615d749b22475f0'),
(317,6,'Glpi\\Form\\Question','question_default_value','en_US','{}','d41d8cd98f00b204e9800998ecf8427e'),
(318,7,'Glpi\\Form\\Question','question_name','en_US','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(319,8,'Glpi\\Form\\Question','question_name','en_US','{}','270774c2dc685cc979a7d7a2426bf193'),
(320,2,'Glpi\\Form\\Form','form_name','en_US','{}','99d2310dc614498390a30da92a419eb2'),
(321,2,'Glpi\\Form\\Form','form_description','en_US','{}','fb1026f69a37a5b62523c53c03402d91'),
(322,9,'Glpi\\Form\\Question','question_name','en_US','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(323,10,'Glpi\\Form\\Question','question_name','en_US','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(324,11,'Glpi\\Form\\Question','question_name','en_US','{}','13fc108822413e5c9a9b177c353b8718'),
(325,12,'Glpi\\Form\\Question','question_name','en_US','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(326,13,'Glpi\\Form\\Question','question_name','en_US','{\"one\":\"Location\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(327,14,'Glpi\\Form\\Question','question_name','en_US','{}','09b79d379db0c82b4615d749b22475f0'),
(328,14,'Glpi\\Form\\Question','question_default_value','en_US','{}','d41d8cd98f00b204e9800998ecf8427e'),
(329,15,'Glpi\\Form\\Question','question_name','en_US','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(330,16,'Glpi\\Form\\Question','question_name','en_US','{}','270774c2dc685cc979a7d7a2426bf193'),
(331,1,'Glpi\\Form\\Form','form_name','es_AR','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(332,1,'Glpi\\Form\\Form','form_description','es_AR','{}','2794669861cc00408fef842e5cf6930a'),
(333,1,'Glpi\\Form\\Question','question_name','es_AR','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(334,2,'Glpi\\Form\\Question','question_name','es_AR','{}','624c6b241d2d14bbd285596ffcf2a9e7'),
(335,3,'Glpi\\Form\\Question','question_name','es_AR','{}','13fc108822413e5c9a9b177c353b8718'),
(336,4,'Glpi\\Form\\Question','question_name','es_AR','{}','afee7117d982a452a8a772b513c58412'),
(337,5,'Glpi\\Form\\Question','question_name','es_AR','{\"one\":\"Ubicaci\\u00f3n\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(338,6,'Glpi\\Form\\Question','question_name','es_AR','{}','09b79d379db0c82b4615d749b22475f0'),
(339,6,'Glpi\\Form\\Question','question_default_value','es_AR','{}','d41d8cd98f00b204e9800998ecf8427e'),
(340,7,'Glpi\\Form\\Question','question_name','es_AR','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(341,8,'Glpi\\Form\\Question','question_name','es_AR','{}','270774c2dc685cc979a7d7a2426bf193'),
(342,2,'Glpi\\Form\\Form','form_name','es_AR','{}','99d2310dc614498390a30da92a419eb2'),
(343,2,'Glpi\\Form\\Form','form_description','es_AR','{}','fb1026f69a37a5b62523c53c03402d91'),
(344,9,'Glpi\\Form\\Question','question_name','es_AR','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(345,10,'Glpi\\Form\\Question','question_name','es_AR','{}','624c6b241d2d14bbd285596ffcf2a9e7'),
(346,11,'Glpi\\Form\\Question','question_name','es_AR','{}','13fc108822413e5c9a9b177c353b8718'),
(347,12,'Glpi\\Form\\Question','question_name','es_AR','{}','afee7117d982a452a8a772b513c58412'),
(348,13,'Glpi\\Form\\Question','question_name','es_AR','{\"one\":\"Ubicaci\\u00f3n\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(349,14,'Glpi\\Form\\Question','question_name','es_AR','{}','09b79d379db0c82b4615d749b22475f0'),
(350,14,'Glpi\\Form\\Question','question_default_value','es_AR','{}','d41d8cd98f00b204e9800998ecf8427e'),
(351,15,'Glpi\\Form\\Question','question_name','es_AR','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(352,16,'Glpi\\Form\\Question','question_name','es_AR','{}','270774c2dc685cc979a7d7a2426bf193'),
(353,1,'Glpi\\Form\\Form','form_name','es_EC','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(354,1,'Glpi\\Form\\Form','form_description','es_EC','{}','2794669861cc00408fef842e5cf6930a'),
(355,1,'Glpi\\Form\\Question','question_name','es_EC','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(356,2,'Glpi\\Form\\Question','question_name','es_EC','{}','624c6b241d2d14bbd285596ffcf2a9e7'),
(357,3,'Glpi\\Form\\Question','question_name','es_EC','{}','13fc108822413e5c9a9b177c353b8718'),
(358,4,'Glpi\\Form\\Question','question_name','es_EC','{}','afee7117d982a452a8a772b513c58412'),
(359,5,'Glpi\\Form\\Question','question_name','es_EC','{\"one\":\"Ubicaci\\u00f3n\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(360,6,'Glpi\\Form\\Question','question_name','es_EC','{}','09b79d379db0c82b4615d749b22475f0'),
(361,6,'Glpi\\Form\\Question','question_default_value','es_EC','{}','d41d8cd98f00b204e9800998ecf8427e'),
(362,7,'Glpi\\Form\\Question','question_name','es_EC','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(363,8,'Glpi\\Form\\Question','question_name','es_EC','{}','270774c2dc685cc979a7d7a2426bf193'),
(364,2,'Glpi\\Form\\Form','form_name','es_EC','{}','99d2310dc614498390a30da92a419eb2'),
(365,2,'Glpi\\Form\\Form','form_description','es_EC','{}','fb1026f69a37a5b62523c53c03402d91'),
(366,9,'Glpi\\Form\\Question','question_name','es_EC','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(367,10,'Glpi\\Form\\Question','question_name','es_EC','{}','624c6b241d2d14bbd285596ffcf2a9e7'),
(368,11,'Glpi\\Form\\Question','question_name','es_EC','{}','13fc108822413e5c9a9b177c353b8718'),
(369,12,'Glpi\\Form\\Question','question_name','es_EC','{}','afee7117d982a452a8a772b513c58412'),
(370,13,'Glpi\\Form\\Question','question_name','es_EC','{\"one\":\"Ubicaci\\u00f3n\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(371,14,'Glpi\\Form\\Question','question_name','es_EC','{}','09b79d379db0c82b4615d749b22475f0'),
(372,14,'Glpi\\Form\\Question','question_default_value','es_EC','{}','d41d8cd98f00b204e9800998ecf8427e'),
(373,15,'Glpi\\Form\\Question','question_name','es_EC','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(374,16,'Glpi\\Form\\Question','question_name','es_EC','{}','270774c2dc685cc979a7d7a2426bf193'),
(375,1,'Glpi\\Form\\Form','form_name','es_CO','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(376,1,'Glpi\\Form\\Form','form_description','es_CO','{}','2794669861cc00408fef842e5cf6930a'),
(377,1,'Glpi\\Form\\Question','question_name','es_CO','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(378,2,'Glpi\\Form\\Question','question_name','es_CO','{}','624c6b241d2d14bbd285596ffcf2a9e7'),
(379,3,'Glpi\\Form\\Question','question_name','es_CO','{}','13fc108822413e5c9a9b177c353b8718'),
(380,4,'Glpi\\Form\\Question','question_name','es_CO','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(381,5,'Glpi\\Form\\Question','question_name','es_CO','{\"one\":\"Localizaciones\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(382,6,'Glpi\\Form\\Question','question_name','es_CO','{}','09b79d379db0c82b4615d749b22475f0'),
(383,6,'Glpi\\Form\\Question','question_default_value','es_CO','{}','d41d8cd98f00b204e9800998ecf8427e'),
(384,7,'Glpi\\Form\\Question','question_name','es_CO','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(385,8,'Glpi\\Form\\Question','question_name','es_CO','{}','270774c2dc685cc979a7d7a2426bf193'),
(386,2,'Glpi\\Form\\Form','form_name','es_CO','{}','99d2310dc614498390a30da92a419eb2'),
(387,2,'Glpi\\Form\\Form','form_description','es_CO','{}','fb1026f69a37a5b62523c53c03402d91'),
(388,9,'Glpi\\Form\\Question','question_name','es_CO','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(389,10,'Glpi\\Form\\Question','question_name','es_CO','{}','624c6b241d2d14bbd285596ffcf2a9e7'),
(390,11,'Glpi\\Form\\Question','question_name','es_CO','{}','13fc108822413e5c9a9b177c353b8718'),
(391,12,'Glpi\\Form\\Question','question_name','es_CO','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(392,13,'Glpi\\Form\\Question','question_name','es_CO','{\"one\":\"Localizaciones\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(393,14,'Glpi\\Form\\Question','question_name','es_CO','{}','09b79d379db0c82b4615d749b22475f0'),
(394,14,'Glpi\\Form\\Question','question_default_value','es_CO','{}','d41d8cd98f00b204e9800998ecf8427e'),
(395,15,'Glpi\\Form\\Question','question_name','es_CO','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(396,16,'Glpi\\Form\\Question','question_name','es_CO','{}','270774c2dc685cc979a7d7a2426bf193'),
(397,1,'Glpi\\Form\\Form','form_name','es_ES','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(398,1,'Glpi\\Form\\Form','form_description','es_ES','{}','2794669861cc00408fef842e5cf6930a'),
(399,1,'Glpi\\Form\\Question','question_name','es_ES','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(400,2,'Glpi\\Form\\Question','question_name','es_ES','{}','624c6b241d2d14bbd285596ffcf2a9e7'),
(401,3,'Glpi\\Form\\Question','question_name','es_ES','{}','13fc108822413e5c9a9b177c353b8718'),
(402,4,'Glpi\\Form\\Question','question_name','es_ES','{}','afee7117d982a452a8a772b513c58412'),
(403,5,'Glpi\\Form\\Question','question_name','es_ES','{}','a22dd2e0bf995c59b63ef79cf2511035'),
(404,6,'Glpi\\Form\\Question','question_name','es_ES','{}','09b79d379db0c82b4615d749b22475f0'),
(405,6,'Glpi\\Form\\Question','question_default_value','es_ES','{}','d41d8cd98f00b204e9800998ecf8427e'),
(406,7,'Glpi\\Form\\Question','question_name','es_ES','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(407,8,'Glpi\\Form\\Question','question_name','es_ES','{}','270774c2dc685cc979a7d7a2426bf193'),
(408,2,'Glpi\\Form\\Form','form_name','es_ES','{}','99d2310dc614498390a30da92a419eb2'),
(409,2,'Glpi\\Form\\Form','form_description','es_ES','{}','fb1026f69a37a5b62523c53c03402d91'),
(410,9,'Glpi\\Form\\Question','question_name','es_ES','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(411,10,'Glpi\\Form\\Question','question_name','es_ES','{}','624c6b241d2d14bbd285596ffcf2a9e7'),
(412,11,'Glpi\\Form\\Question','question_name','es_ES','{}','13fc108822413e5c9a9b177c353b8718'),
(413,12,'Glpi\\Form\\Question','question_name','es_ES','{}','afee7117d982a452a8a772b513c58412'),
(414,13,'Glpi\\Form\\Question','question_name','es_ES','{}','a22dd2e0bf995c59b63ef79cf2511035'),
(415,14,'Glpi\\Form\\Question','question_name','es_ES','{}','09b79d379db0c82b4615d749b22475f0'),
(416,14,'Glpi\\Form\\Question','question_default_value','es_ES','{}','d41d8cd98f00b204e9800998ecf8427e'),
(417,15,'Glpi\\Form\\Question','question_name','es_ES','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(418,16,'Glpi\\Form\\Question','question_name','es_ES','{}','270774c2dc685cc979a7d7a2426bf193'),
(419,1,'Glpi\\Form\\Form','form_name','es_419','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(420,1,'Glpi\\Form\\Form','form_description','es_419','{}','2794669861cc00408fef842e5cf6930a'),
(421,1,'Glpi\\Form\\Question','question_name','es_419','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(422,2,'Glpi\\Form\\Question','question_name','es_419','{}','624c6b241d2d14bbd285596ffcf2a9e7'),
(423,3,'Glpi\\Form\\Question','question_name','es_419','{}','13fc108822413e5c9a9b177c353b8718'),
(424,4,'Glpi\\Form\\Question','question_name','es_419','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(425,5,'Glpi\\Form\\Question','question_name','es_419','{\"one\":\"Ubicaci\\u00f3n\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(426,6,'Glpi\\Form\\Question','question_name','es_419','{}','09b79d379db0c82b4615d749b22475f0'),
(427,6,'Glpi\\Form\\Question','question_default_value','es_419','{}','d41d8cd98f00b204e9800998ecf8427e'),
(428,7,'Glpi\\Form\\Question','question_name','es_419','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(429,8,'Glpi\\Form\\Question','question_name','es_419','{}','270774c2dc685cc979a7d7a2426bf193'),
(430,2,'Glpi\\Form\\Form','form_name','es_419','{}','99d2310dc614498390a30da92a419eb2'),
(431,2,'Glpi\\Form\\Form','form_description','es_419','{}','fb1026f69a37a5b62523c53c03402d91'),
(432,9,'Glpi\\Form\\Question','question_name','es_419','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(433,10,'Glpi\\Form\\Question','question_name','es_419','{}','624c6b241d2d14bbd285596ffcf2a9e7'),
(434,11,'Glpi\\Form\\Question','question_name','es_419','{}','13fc108822413e5c9a9b177c353b8718'),
(435,12,'Glpi\\Form\\Question','question_name','es_419','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(436,13,'Glpi\\Form\\Question','question_name','es_419','{\"one\":\"Ubicaci\\u00f3n\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(437,14,'Glpi\\Form\\Question','question_name','es_419','{}','09b79d379db0c82b4615d749b22475f0'),
(438,14,'Glpi\\Form\\Question','question_default_value','es_419','{}','d41d8cd98f00b204e9800998ecf8427e'),
(439,15,'Glpi\\Form\\Question','question_name','es_419','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(440,16,'Glpi\\Form\\Question','question_name','es_419','{}','270774c2dc685cc979a7d7a2426bf193'),
(441,1,'Glpi\\Form\\Form','form_name','es_MX','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(442,1,'Glpi\\Form\\Form','form_description','es_MX','{}','2794669861cc00408fef842e5cf6930a'),
(443,1,'Glpi\\Form\\Question','question_name','es_MX','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(444,2,'Glpi\\Form\\Question','question_name','es_MX','{}','624c6b241d2d14bbd285596ffcf2a9e7'),
(445,3,'Glpi\\Form\\Question','question_name','es_MX','{}','13fc108822413e5c9a9b177c353b8718'),
(446,4,'Glpi\\Form\\Question','question_name','es_MX','{}','afee7117d982a452a8a772b513c58412'),
(447,5,'Glpi\\Form\\Question','question_name','es_MX','{\"one\":\"Ubicaci\\u00f3n\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(448,6,'Glpi\\Form\\Question','question_name','es_MX','{}','09b79d379db0c82b4615d749b22475f0'),
(449,6,'Glpi\\Form\\Question','question_default_value','es_MX','{}','d41d8cd98f00b204e9800998ecf8427e'),
(450,7,'Glpi\\Form\\Question','question_name','es_MX','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(451,8,'Glpi\\Form\\Question','question_name','es_MX','{}','270774c2dc685cc979a7d7a2426bf193'),
(452,2,'Glpi\\Form\\Form','form_name','es_MX','{}','99d2310dc614498390a30da92a419eb2'),
(453,2,'Glpi\\Form\\Form','form_description','es_MX','{}','fb1026f69a37a5b62523c53c03402d91'),
(454,9,'Glpi\\Form\\Question','question_name','es_MX','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(455,10,'Glpi\\Form\\Question','question_name','es_MX','{}','624c6b241d2d14bbd285596ffcf2a9e7'),
(456,11,'Glpi\\Form\\Question','question_name','es_MX','{}','13fc108822413e5c9a9b177c353b8718'),
(457,12,'Glpi\\Form\\Question','question_name','es_MX','{}','afee7117d982a452a8a772b513c58412'),
(458,13,'Glpi\\Form\\Question','question_name','es_MX','{\"one\":\"Ubicaci\\u00f3n\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(459,14,'Glpi\\Form\\Question','question_name','es_MX','{}','09b79d379db0c82b4615d749b22475f0'),
(460,14,'Glpi\\Form\\Question','question_default_value','es_MX','{}','d41d8cd98f00b204e9800998ecf8427e'),
(461,15,'Glpi\\Form\\Question','question_name','es_MX','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(462,16,'Glpi\\Form\\Question','question_name','es_MX','{}','270774c2dc685cc979a7d7a2426bf193'),
(463,1,'Glpi\\Form\\Form','form_name','es_VE','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(464,1,'Glpi\\Form\\Form','form_description','es_VE','{}','2794669861cc00408fef842e5cf6930a'),
(465,1,'Glpi\\Form\\Question','question_name','es_VE','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(466,2,'Glpi\\Form\\Question','question_name','es_VE','{}','624c6b241d2d14bbd285596ffcf2a9e7'),
(467,3,'Glpi\\Form\\Question','question_name','es_VE','{}','13fc108822413e5c9a9b177c353b8718'),
(468,4,'Glpi\\Form\\Question','question_name','es_VE','{\"one\":\"Supervisores\"}','afee7117d982a452a8a772b513c58412'),
(469,5,'Glpi\\Form\\Question','question_name','es_VE','{\"one\":\"Lugar\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(470,6,'Glpi\\Form\\Question','question_name','es_VE','{}','09b79d379db0c82b4615d749b22475f0'),
(471,6,'Glpi\\Form\\Question','question_default_value','es_VE','{}','d41d8cd98f00b204e9800998ecf8427e'),
(472,7,'Glpi\\Form\\Question','question_name','es_VE','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(473,8,'Glpi\\Form\\Question','question_name','es_VE','{}','270774c2dc685cc979a7d7a2426bf193'),
(474,2,'Glpi\\Form\\Form','form_name','es_VE','{}','99d2310dc614498390a30da92a419eb2'),
(475,2,'Glpi\\Form\\Form','form_description','es_VE','{}','fb1026f69a37a5b62523c53c03402d91'),
(476,9,'Glpi\\Form\\Question','question_name','es_VE','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(477,10,'Glpi\\Form\\Question','question_name','es_VE','{}','624c6b241d2d14bbd285596ffcf2a9e7'),
(478,11,'Glpi\\Form\\Question','question_name','es_VE','{}','13fc108822413e5c9a9b177c353b8718'),
(479,12,'Glpi\\Form\\Question','question_name','es_VE','{\"one\":\"Supervisores\"}','afee7117d982a452a8a772b513c58412'),
(480,13,'Glpi\\Form\\Question','question_name','es_VE','{\"one\":\"Lugar\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(481,14,'Glpi\\Form\\Question','question_name','es_VE','{}','09b79d379db0c82b4615d749b22475f0'),
(482,14,'Glpi\\Form\\Question','question_default_value','es_VE','{}','d41d8cd98f00b204e9800998ecf8427e'),
(483,15,'Glpi\\Form\\Question','question_name','es_VE','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(484,16,'Glpi\\Form\\Question','question_name','es_VE','{}','270774c2dc685cc979a7d7a2426bf193'),
(485,1,'Glpi\\Form\\Form','form_name','eu_ES','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(486,1,'Glpi\\Form\\Form','form_description','eu_ES','{}','2794669861cc00408fef842e5cf6930a'),
(487,1,'Glpi\\Form\\Question','question_name','eu_ES','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(488,2,'Glpi\\Form\\Question','question_name','eu_ES','{\"one\":\"Kategoria\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(489,3,'Glpi\\Form\\Question','question_name','eu_ES','{}','13fc108822413e5c9a9b177c353b8718'),
(490,4,'Glpi\\Form\\Question','question_name','eu_ES','{\"one\":\"Ikuskariak\"}','afee7117d982a452a8a772b513c58412'),
(491,5,'Glpi\\Form\\Question','question_name','eu_ES','{\"one\":\"Kokalekuak\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(492,6,'Glpi\\Form\\Question','question_name','eu_ES','{}','09b79d379db0c82b4615d749b22475f0'),
(493,6,'Glpi\\Form\\Question','question_default_value','eu_ES','{}','d41d8cd98f00b204e9800998ecf8427e'),
(494,7,'Glpi\\Form\\Question','question_name','eu_ES','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(495,8,'Glpi\\Form\\Question','question_name','eu_ES','{}','270774c2dc685cc979a7d7a2426bf193'),
(496,2,'Glpi\\Form\\Form','form_name','eu_ES','{}','99d2310dc614498390a30da92a419eb2'),
(497,2,'Glpi\\Form\\Form','form_description','eu_ES','{}','fb1026f69a37a5b62523c53c03402d91'),
(498,9,'Glpi\\Form\\Question','question_name','eu_ES','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(499,10,'Glpi\\Form\\Question','question_name','eu_ES','{\"one\":\"Kategoria\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(500,11,'Glpi\\Form\\Question','question_name','eu_ES','{}','13fc108822413e5c9a9b177c353b8718'),
(501,12,'Glpi\\Form\\Question','question_name','eu_ES','{\"one\":\"Ikuskariak\"}','afee7117d982a452a8a772b513c58412'),
(502,13,'Glpi\\Form\\Question','question_name','eu_ES','{\"one\":\"Kokalekuak\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(503,14,'Glpi\\Form\\Question','question_name','eu_ES','{}','09b79d379db0c82b4615d749b22475f0'),
(504,14,'Glpi\\Form\\Question','question_default_value','eu_ES','{}','d41d8cd98f00b204e9800998ecf8427e'),
(505,15,'Glpi\\Form\\Question','question_name','eu_ES','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(506,16,'Glpi\\Form\\Question','question_name','eu_ES','{}','270774c2dc685cc979a7d7a2426bf193'),
(507,1,'Glpi\\Form\\Form','form_name','fr_FR','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(508,1,'Glpi\\Form\\Form','form_description','fr_FR','{}','2794669861cc00408fef842e5cf6930a'),
(509,1,'Glpi\\Form\\Question','question_name','fr_FR','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(510,2,'Glpi\\Form\\Question','question_name','fr_FR','{\"one\":\"Cat\\u00e9gorie\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(511,3,'Glpi\\Form\\Question','question_name','fr_FR','{}','13fc108822413e5c9a9b177c353b8718'),
(512,4,'Glpi\\Form\\Question','question_name','fr_FR','{\"one\":\"Observateurs\"}','afee7117d982a452a8a772b513c58412'),
(513,5,'Glpi\\Form\\Question','question_name','fr_FR','{\"one\":\"Lieu\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(514,6,'Glpi\\Form\\Question','question_name','fr_FR','{}','09b79d379db0c82b4615d749b22475f0'),
(515,6,'Glpi\\Form\\Question','question_default_value','fr_FR','{}','d41d8cd98f00b204e9800998ecf8427e'),
(516,7,'Glpi\\Form\\Question','question_name','fr_FR','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(517,8,'Glpi\\Form\\Question','question_name','fr_FR','{}','270774c2dc685cc979a7d7a2426bf193'),
(518,2,'Glpi\\Form\\Form','form_name','fr_FR','{}','99d2310dc614498390a30da92a419eb2'),
(519,2,'Glpi\\Form\\Form','form_description','fr_FR','{}','fb1026f69a37a5b62523c53c03402d91'),
(520,9,'Glpi\\Form\\Question','question_name','fr_FR','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(521,10,'Glpi\\Form\\Question','question_name','fr_FR','{\"one\":\"Cat\\u00e9gorie\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(522,11,'Glpi\\Form\\Question','question_name','fr_FR','{}','13fc108822413e5c9a9b177c353b8718'),
(523,12,'Glpi\\Form\\Question','question_name','fr_FR','{\"one\":\"Observateurs\"}','afee7117d982a452a8a772b513c58412'),
(524,13,'Glpi\\Form\\Question','question_name','fr_FR','{\"one\":\"Lieu\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(525,14,'Glpi\\Form\\Question','question_name','fr_FR','{}','09b79d379db0c82b4615d749b22475f0'),
(526,14,'Glpi\\Form\\Question','question_default_value','fr_FR','{}','d41d8cd98f00b204e9800998ecf8427e'),
(527,15,'Glpi\\Form\\Question','question_name','fr_FR','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(528,16,'Glpi\\Form\\Question','question_name','fr_FR','{}','270774c2dc685cc979a7d7a2426bf193'),
(529,1,'Glpi\\Form\\Form','form_name','fr_CA','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(530,1,'Glpi\\Form\\Form','form_description','fr_CA','{}','2794669861cc00408fef842e5cf6930a'),
(531,1,'Glpi\\Form\\Question','question_name','fr_CA','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(532,2,'Glpi\\Form\\Question','question_name','fr_CA','{\"one\":\"Cat\\u00e9gorie\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(533,3,'Glpi\\Form\\Question','question_name','fr_CA','{}','13fc108822413e5c9a9b177c353b8718'),
(534,4,'Glpi\\Form\\Question','question_name','fr_CA','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(535,5,'Glpi\\Form\\Question','question_name','fr_CA','{\"one\":\"Lieu\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(536,6,'Glpi\\Form\\Question','question_name','fr_CA','{}','09b79d379db0c82b4615d749b22475f0'),
(537,6,'Glpi\\Form\\Question','question_default_value','fr_CA','{}','d41d8cd98f00b204e9800998ecf8427e'),
(538,7,'Glpi\\Form\\Question','question_name','fr_CA','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(539,8,'Glpi\\Form\\Question','question_name','fr_CA','{}','270774c2dc685cc979a7d7a2426bf193'),
(540,2,'Glpi\\Form\\Form','form_name','fr_CA','{}','99d2310dc614498390a30da92a419eb2'),
(541,2,'Glpi\\Form\\Form','form_description','fr_CA','{}','fb1026f69a37a5b62523c53c03402d91'),
(542,9,'Glpi\\Form\\Question','question_name','fr_CA','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(543,10,'Glpi\\Form\\Question','question_name','fr_CA','{\"one\":\"Cat\\u00e9gorie\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(544,11,'Glpi\\Form\\Question','question_name','fr_CA','{}','13fc108822413e5c9a9b177c353b8718'),
(545,12,'Glpi\\Form\\Question','question_name','fr_CA','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(546,13,'Glpi\\Form\\Question','question_name','fr_CA','{\"one\":\"Lieu\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(547,14,'Glpi\\Form\\Question','question_name','fr_CA','{}','09b79d379db0c82b4615d749b22475f0'),
(548,14,'Glpi\\Form\\Question','question_default_value','fr_CA','{}','d41d8cd98f00b204e9800998ecf8427e'),
(549,15,'Glpi\\Form\\Question','question_name','fr_CA','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(550,16,'Glpi\\Form\\Question','question_name','fr_CA','{}','270774c2dc685cc979a7d7a2426bf193'),
(551,1,'Glpi\\Form\\Form','form_name','fr_BE','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(552,1,'Glpi\\Form\\Form','form_description','fr_BE','{}','2794669861cc00408fef842e5cf6930a'),
(553,1,'Glpi\\Form\\Question','question_name','fr_BE','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(554,2,'Glpi\\Form\\Question','question_name','fr_BE','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(555,3,'Glpi\\Form\\Question','question_name','fr_BE','{}','13fc108822413e5c9a9b177c353b8718'),
(556,4,'Glpi\\Form\\Question','question_name','fr_BE','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(557,5,'Glpi\\Form\\Question','question_name','fr_BE','{\"one\":\"Lieux\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(558,6,'Glpi\\Form\\Question','question_name','fr_BE','{}','09b79d379db0c82b4615d749b22475f0'),
(559,6,'Glpi\\Form\\Question','question_default_value','fr_BE','{}','d41d8cd98f00b204e9800998ecf8427e'),
(560,7,'Glpi\\Form\\Question','question_name','fr_BE','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(561,8,'Glpi\\Form\\Question','question_name','fr_BE','{}','270774c2dc685cc979a7d7a2426bf193'),
(562,2,'Glpi\\Form\\Form','form_name','fr_BE','{}','99d2310dc614498390a30da92a419eb2'),
(563,2,'Glpi\\Form\\Form','form_description','fr_BE','{}','fb1026f69a37a5b62523c53c03402d91'),
(564,9,'Glpi\\Form\\Question','question_name','fr_BE','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(565,10,'Glpi\\Form\\Question','question_name','fr_BE','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(566,11,'Glpi\\Form\\Question','question_name','fr_BE','{}','13fc108822413e5c9a9b177c353b8718'),
(567,12,'Glpi\\Form\\Question','question_name','fr_BE','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(568,13,'Glpi\\Form\\Question','question_name','fr_BE','{\"one\":\"Lieux\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(569,14,'Glpi\\Form\\Question','question_name','fr_BE','{}','09b79d379db0c82b4615d749b22475f0'),
(570,14,'Glpi\\Form\\Question','question_default_value','fr_BE','{}','d41d8cd98f00b204e9800998ecf8427e'),
(571,15,'Glpi\\Form\\Question','question_name','fr_BE','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(572,16,'Glpi\\Form\\Question','question_name','fr_BE','{}','270774c2dc685cc979a7d7a2426bf193'),
(573,1,'Glpi\\Form\\Form','form_name','gl_ES','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(574,1,'Glpi\\Form\\Form','form_description','gl_ES','{}','2794669861cc00408fef842e5cf6930a'),
(575,1,'Glpi\\Form\\Question','question_name','gl_ES','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(576,2,'Glpi\\Form\\Question','question_name','gl_ES','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(577,3,'Glpi\\Form\\Question','question_name','gl_ES','{}','13fc108822413e5c9a9b177c353b8718'),
(578,4,'Glpi\\Form\\Question','question_name','gl_ES','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(579,5,'Glpi\\Form\\Question','question_name','gl_ES','{\"one\":\"Localizaci\\u00f3n\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(580,6,'Glpi\\Form\\Question','question_name','gl_ES','{}','09b79d379db0c82b4615d749b22475f0'),
(581,6,'Glpi\\Form\\Question','question_default_value','gl_ES','{}','d41d8cd98f00b204e9800998ecf8427e'),
(582,7,'Glpi\\Form\\Question','question_name','gl_ES','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(583,8,'Glpi\\Form\\Question','question_name','gl_ES','{}','270774c2dc685cc979a7d7a2426bf193'),
(584,2,'Glpi\\Form\\Form','form_name','gl_ES','{}','99d2310dc614498390a30da92a419eb2'),
(585,2,'Glpi\\Form\\Form','form_description','gl_ES','{}','fb1026f69a37a5b62523c53c03402d91'),
(586,9,'Glpi\\Form\\Question','question_name','gl_ES','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(587,10,'Glpi\\Form\\Question','question_name','gl_ES','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(588,11,'Glpi\\Form\\Question','question_name','gl_ES','{}','13fc108822413e5c9a9b177c353b8718'),
(589,12,'Glpi\\Form\\Question','question_name','gl_ES','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(590,13,'Glpi\\Form\\Question','question_name','gl_ES','{\"one\":\"Localizaci\\u00f3n\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(591,14,'Glpi\\Form\\Question','question_name','gl_ES','{}','09b79d379db0c82b4615d749b22475f0'),
(592,14,'Glpi\\Form\\Question','question_default_value','gl_ES','{}','d41d8cd98f00b204e9800998ecf8427e'),
(593,15,'Glpi\\Form\\Question','question_name','gl_ES','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(594,16,'Glpi\\Form\\Question','question_name','gl_ES','{}','270774c2dc685cc979a7d7a2426bf193'),
(595,1,'Glpi\\Form\\Form','form_name','el_GR','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(596,1,'Glpi\\Form\\Form','form_description','el_GR','{}','2794669861cc00408fef842e5cf6930a'),
(597,1,'Glpi\\Form\\Question','question_name','el_GR','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(598,2,'Glpi\\Form\\Question','question_name','el_GR','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(599,3,'Glpi\\Form\\Question','question_name','el_GR','{}','13fc108822413e5c9a9b177c353b8718'),
(600,4,'Glpi\\Form\\Question','question_name','el_GR','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(601,5,'Glpi\\Form\\Question','question_name','el_GR','{\"one\":\"\\u03a4\\u03bf\\u03c0\\u03bf\\u03b8\\u03b5\\u03c3\\u03af\\u03b5\\u03c2\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(602,6,'Glpi\\Form\\Question','question_name','el_GR','{}','09b79d379db0c82b4615d749b22475f0'),
(603,6,'Glpi\\Form\\Question','question_default_value','el_GR','{}','d41d8cd98f00b204e9800998ecf8427e'),
(604,7,'Glpi\\Form\\Question','question_name','el_GR','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(605,8,'Glpi\\Form\\Question','question_name','el_GR','{}','270774c2dc685cc979a7d7a2426bf193'),
(606,2,'Glpi\\Form\\Form','form_name','el_GR','{}','99d2310dc614498390a30da92a419eb2'),
(607,2,'Glpi\\Form\\Form','form_description','el_GR','{}','fb1026f69a37a5b62523c53c03402d91'),
(608,9,'Glpi\\Form\\Question','question_name','el_GR','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(609,10,'Glpi\\Form\\Question','question_name','el_GR','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(610,11,'Glpi\\Form\\Question','question_name','el_GR','{}','13fc108822413e5c9a9b177c353b8718'),
(611,12,'Glpi\\Form\\Question','question_name','el_GR','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(612,13,'Glpi\\Form\\Question','question_name','el_GR','{\"one\":\"\\u03a4\\u03bf\\u03c0\\u03bf\\u03b8\\u03b5\\u03c3\\u03af\\u03b5\\u03c2\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(613,14,'Glpi\\Form\\Question','question_name','el_GR','{}','09b79d379db0c82b4615d749b22475f0'),
(614,14,'Glpi\\Form\\Question','question_default_value','el_GR','{}','d41d8cd98f00b204e9800998ecf8427e'),
(615,15,'Glpi\\Form\\Question','question_name','el_GR','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(616,16,'Glpi\\Form\\Question','question_name','el_GR','{}','270774c2dc685cc979a7d7a2426bf193'),
(617,1,'Glpi\\Form\\Form','form_name','he_IL','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(618,1,'Glpi\\Form\\Form','form_description','he_IL','{}','2794669861cc00408fef842e5cf6930a'),
(619,1,'Glpi\\Form\\Question','question_name','he_IL','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(620,2,'Glpi\\Form\\Question','question_name','he_IL','{\"one\":\"\\u05e7\\u05d8\\u05d2\\u05d5\\u05e8\\u05d9\\u05d4\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(621,3,'Glpi\\Form\\Question','question_name','he_IL','{}','13fc108822413e5c9a9b177c353b8718'),
(622,4,'Glpi\\Form\\Question','question_name','he_IL','{\"one\":\"\\u05de\\u05e9\\u05e7\\u05d9\\u05e4\\u05d9\\u05dd\"}','afee7117d982a452a8a772b513c58412'),
(623,5,'Glpi\\Form\\Question','question_name','he_IL','{\"one\":\"\\u05de\\u05d9\\u05e7\\u05d5\\u05dd\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(624,6,'Glpi\\Form\\Question','question_name','he_IL','{}','09b79d379db0c82b4615d749b22475f0'),
(625,6,'Glpi\\Form\\Question','question_default_value','he_IL','{}','d41d8cd98f00b204e9800998ecf8427e'),
(626,7,'Glpi\\Form\\Question','question_name','he_IL','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(627,8,'Glpi\\Form\\Question','question_name','he_IL','{}','270774c2dc685cc979a7d7a2426bf193'),
(628,2,'Glpi\\Form\\Form','form_name','he_IL','{}','99d2310dc614498390a30da92a419eb2'),
(629,2,'Glpi\\Form\\Form','form_description','he_IL','{}','fb1026f69a37a5b62523c53c03402d91'),
(630,9,'Glpi\\Form\\Question','question_name','he_IL','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(631,10,'Glpi\\Form\\Question','question_name','he_IL','{\"one\":\"\\u05e7\\u05d8\\u05d2\\u05d5\\u05e8\\u05d9\\u05d4\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(632,11,'Glpi\\Form\\Question','question_name','he_IL','{}','13fc108822413e5c9a9b177c353b8718'),
(633,12,'Glpi\\Form\\Question','question_name','he_IL','{\"one\":\"\\u05de\\u05e9\\u05e7\\u05d9\\u05e4\\u05d9\\u05dd\"}','afee7117d982a452a8a772b513c58412'),
(634,13,'Glpi\\Form\\Question','question_name','he_IL','{\"one\":\"\\u05de\\u05d9\\u05e7\\u05d5\\u05dd\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(635,14,'Glpi\\Form\\Question','question_name','he_IL','{}','09b79d379db0c82b4615d749b22475f0'),
(636,14,'Glpi\\Form\\Question','question_default_value','he_IL','{}','d41d8cd98f00b204e9800998ecf8427e'),
(637,15,'Glpi\\Form\\Question','question_name','he_IL','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(638,16,'Glpi\\Form\\Question','question_name','he_IL','{}','270774c2dc685cc979a7d7a2426bf193'),
(639,1,'Glpi\\Form\\Form','form_name','hi_IN','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(640,1,'Glpi\\Form\\Form','form_description','hi_IN','{}','2794669861cc00408fef842e5cf6930a'),
(641,1,'Glpi\\Form\\Question','question_name','hi_IN','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(642,2,'Glpi\\Form\\Question','question_name','hi_IN','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(643,3,'Glpi\\Form\\Question','question_name','hi_IN','{}','13fc108822413e5c9a9b177c353b8718'),
(644,4,'Glpi\\Form\\Question','question_name','hi_IN','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(645,5,'Glpi\\Form\\Question','question_name','hi_IN','{\"one\":\"\\u0938\\u094d\\u0925\\u093e\\u0928\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(646,6,'Glpi\\Form\\Question','question_name','hi_IN','{}','09b79d379db0c82b4615d749b22475f0'),
(647,6,'Glpi\\Form\\Question','question_default_value','hi_IN','{}','d41d8cd98f00b204e9800998ecf8427e'),
(648,7,'Glpi\\Form\\Question','question_name','hi_IN','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(649,8,'Glpi\\Form\\Question','question_name','hi_IN','{}','270774c2dc685cc979a7d7a2426bf193'),
(650,2,'Glpi\\Form\\Form','form_name','hi_IN','{}','99d2310dc614498390a30da92a419eb2'),
(651,2,'Glpi\\Form\\Form','form_description','hi_IN','{}','fb1026f69a37a5b62523c53c03402d91'),
(652,9,'Glpi\\Form\\Question','question_name','hi_IN','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(653,10,'Glpi\\Form\\Question','question_name','hi_IN','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(654,11,'Glpi\\Form\\Question','question_name','hi_IN','{}','13fc108822413e5c9a9b177c353b8718'),
(655,12,'Glpi\\Form\\Question','question_name','hi_IN','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(656,13,'Glpi\\Form\\Question','question_name','hi_IN','{\"one\":\"\\u0938\\u094d\\u0925\\u093e\\u0928\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(657,14,'Glpi\\Form\\Question','question_name','hi_IN','{}','09b79d379db0c82b4615d749b22475f0'),
(658,14,'Glpi\\Form\\Question','question_default_value','hi_IN','{}','d41d8cd98f00b204e9800998ecf8427e'),
(659,15,'Glpi\\Form\\Question','question_name','hi_IN','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(660,16,'Glpi\\Form\\Question','question_name','hi_IN','{}','270774c2dc685cc979a7d7a2426bf193'),
(661,1,'Glpi\\Form\\Form','form_name','hr_HR','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(662,1,'Glpi\\Form\\Form','form_description','hr_HR','{}','2794669861cc00408fef842e5cf6930a'),
(663,1,'Glpi\\Form\\Question','question_name','hr_HR','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(664,2,'Glpi\\Form\\Question','question_name','hr_HR','{\"one\":\"Kategorija\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(665,3,'Glpi\\Form\\Question','question_name','hr_HR','{}','13fc108822413e5c9a9b177c353b8718'),
(666,4,'Glpi\\Form\\Question','question_name','hr_HR','{\"one\":\"Promatra\\u010di\"}','afee7117d982a452a8a772b513c58412'),
(667,5,'Glpi\\Form\\Question','question_name','hr_HR','{\"one\":\"Lokacija\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(668,6,'Glpi\\Form\\Question','question_name','hr_HR','{}','09b79d379db0c82b4615d749b22475f0'),
(669,6,'Glpi\\Form\\Question','question_default_value','hr_HR','{}','d41d8cd98f00b204e9800998ecf8427e'),
(670,7,'Glpi\\Form\\Question','question_name','hr_HR','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(671,8,'Glpi\\Form\\Question','question_name','hr_HR','{}','270774c2dc685cc979a7d7a2426bf193'),
(672,2,'Glpi\\Form\\Form','form_name','hr_HR','{}','99d2310dc614498390a30da92a419eb2'),
(673,2,'Glpi\\Form\\Form','form_description','hr_HR','{}','fb1026f69a37a5b62523c53c03402d91'),
(674,9,'Glpi\\Form\\Question','question_name','hr_HR','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(675,10,'Glpi\\Form\\Question','question_name','hr_HR','{\"one\":\"Kategorija\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(676,11,'Glpi\\Form\\Question','question_name','hr_HR','{}','13fc108822413e5c9a9b177c353b8718'),
(677,12,'Glpi\\Form\\Question','question_name','hr_HR','{\"one\":\"Promatra\\u010di\"}','afee7117d982a452a8a772b513c58412'),
(678,13,'Glpi\\Form\\Question','question_name','hr_HR','{\"one\":\"Lokacija\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(679,14,'Glpi\\Form\\Question','question_name','hr_HR','{}','09b79d379db0c82b4615d749b22475f0'),
(680,14,'Glpi\\Form\\Question','question_default_value','hr_HR','{}','d41d8cd98f00b204e9800998ecf8427e'),
(681,15,'Glpi\\Form\\Question','question_name','hr_HR','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(682,16,'Glpi\\Form\\Question','question_name','hr_HR','{}','270774c2dc685cc979a7d7a2426bf193'),
(683,1,'Glpi\\Form\\Form','form_name','hu_HU','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(684,1,'Glpi\\Form\\Form','form_description','hu_HU','{}','2794669861cc00408fef842e5cf6930a'),
(685,1,'Glpi\\Form\\Question','question_name','hu_HU','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(686,2,'Glpi\\Form\\Question','question_name','hu_HU','{\"one\":\"Kateg\\u00f3ria\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(687,3,'Glpi\\Form\\Question','question_name','hu_HU','{}','13fc108822413e5c9a9b177c353b8718'),
(688,4,'Glpi\\Form\\Question','question_name','hu_HU','{\"one\":\"Megfigyel\\u0151k\"}','afee7117d982a452a8a772b513c58412'),
(689,5,'Glpi\\Form\\Question','question_name','hu_HU','{\"one\":\"Helyek\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(690,6,'Glpi\\Form\\Question','question_name','hu_HU','{}','09b79d379db0c82b4615d749b22475f0'),
(691,6,'Glpi\\Form\\Question','question_default_value','hu_HU','{}','d41d8cd98f00b204e9800998ecf8427e'),
(692,7,'Glpi\\Form\\Question','question_name','hu_HU','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(693,8,'Glpi\\Form\\Question','question_name','hu_HU','{}','270774c2dc685cc979a7d7a2426bf193'),
(694,2,'Glpi\\Form\\Form','form_name','hu_HU','{}','99d2310dc614498390a30da92a419eb2'),
(695,2,'Glpi\\Form\\Form','form_description','hu_HU','{}','fb1026f69a37a5b62523c53c03402d91'),
(696,9,'Glpi\\Form\\Question','question_name','hu_HU','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(697,10,'Glpi\\Form\\Question','question_name','hu_HU','{\"one\":\"Kateg\\u00f3ria\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(698,11,'Glpi\\Form\\Question','question_name','hu_HU','{}','13fc108822413e5c9a9b177c353b8718'),
(699,12,'Glpi\\Form\\Question','question_name','hu_HU','{\"one\":\"Megfigyel\\u0151k\"}','afee7117d982a452a8a772b513c58412'),
(700,13,'Glpi\\Form\\Question','question_name','hu_HU','{\"one\":\"Helyek\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(701,14,'Glpi\\Form\\Question','question_name','hu_HU','{}','09b79d379db0c82b4615d749b22475f0'),
(702,14,'Glpi\\Form\\Question','question_default_value','hu_HU','{}','d41d8cd98f00b204e9800998ecf8427e'),
(703,15,'Glpi\\Form\\Question','question_name','hu_HU','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(704,16,'Glpi\\Form\\Question','question_name','hu_HU','{}','270774c2dc685cc979a7d7a2426bf193'),
(705,1,'Glpi\\Form\\Form','form_name','it_IT','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(706,1,'Glpi\\Form\\Form','form_description','it_IT','{}','2794669861cc00408fef842e5cf6930a'),
(707,1,'Glpi\\Form\\Question','question_name','it_IT','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(708,2,'Glpi\\Form\\Question','question_name','it_IT','{\"one\":\"Categoria\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(709,3,'Glpi\\Form\\Question','question_name','it_IT','{}','13fc108822413e5c9a9b177c353b8718'),
(710,4,'Glpi\\Form\\Question','question_name','it_IT','{\"one\":\"Osservatori\"}','afee7117d982a452a8a772b513c58412'),
(711,5,'Glpi\\Form\\Question','question_name','it_IT','{\"one\":\"Posizione\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(712,6,'Glpi\\Form\\Question','question_name','it_IT','{}','09b79d379db0c82b4615d749b22475f0'),
(713,6,'Glpi\\Form\\Question','question_default_value','it_IT','{}','d41d8cd98f00b204e9800998ecf8427e'),
(714,7,'Glpi\\Form\\Question','question_name','it_IT','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(715,8,'Glpi\\Form\\Question','question_name','it_IT','{}','270774c2dc685cc979a7d7a2426bf193'),
(716,2,'Glpi\\Form\\Form','form_name','it_IT','{}','99d2310dc614498390a30da92a419eb2'),
(717,2,'Glpi\\Form\\Form','form_description','it_IT','{}','fb1026f69a37a5b62523c53c03402d91'),
(718,9,'Glpi\\Form\\Question','question_name','it_IT','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(719,10,'Glpi\\Form\\Question','question_name','it_IT','{\"one\":\"Categoria\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(720,11,'Glpi\\Form\\Question','question_name','it_IT','{}','13fc108822413e5c9a9b177c353b8718'),
(721,12,'Glpi\\Form\\Question','question_name','it_IT','{\"one\":\"Osservatori\"}','afee7117d982a452a8a772b513c58412'),
(722,13,'Glpi\\Form\\Question','question_name','it_IT','{\"one\":\"Posizione\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(723,14,'Glpi\\Form\\Question','question_name','it_IT','{}','09b79d379db0c82b4615d749b22475f0'),
(724,14,'Glpi\\Form\\Question','question_default_value','it_IT','{}','d41d8cd98f00b204e9800998ecf8427e'),
(725,15,'Glpi\\Form\\Question','question_name','it_IT','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(726,16,'Glpi\\Form\\Question','question_name','it_IT','{}','270774c2dc685cc979a7d7a2426bf193'),
(727,1,'Glpi\\Form\\Form','form_name','km_KH','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(728,1,'Glpi\\Form\\Form','form_description','km_KH','{}','2794669861cc00408fef842e5cf6930a'),
(729,1,'Glpi\\Form\\Question','question_name','km_KH','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(730,2,'Glpi\\Form\\Question','question_name','km_KH','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(731,3,'Glpi\\Form\\Question','question_name','km_KH','{}','13fc108822413e5c9a9b177c353b8718'),
(732,4,'Glpi\\Form\\Question','question_name','km_KH','{\"one\":\"Observer\"}','afee7117d982a452a8a772b513c58412'),
(733,5,'Glpi\\Form\\Question','question_name','km_KH','{\"one\":\"Location\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(734,6,'Glpi\\Form\\Question','question_name','km_KH','{}','09b79d379db0c82b4615d749b22475f0'),
(735,6,'Glpi\\Form\\Question','question_default_value','km_KH','{}','d41d8cd98f00b204e9800998ecf8427e'),
(736,7,'Glpi\\Form\\Question','question_name','km_KH','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(737,8,'Glpi\\Form\\Question','question_name','km_KH','{}','270774c2dc685cc979a7d7a2426bf193'),
(738,2,'Glpi\\Form\\Form','form_name','km_KH','{}','99d2310dc614498390a30da92a419eb2'),
(739,2,'Glpi\\Form\\Form','form_description','km_KH','{}','fb1026f69a37a5b62523c53c03402d91'),
(740,9,'Glpi\\Form\\Question','question_name','km_KH','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(741,10,'Glpi\\Form\\Question','question_name','km_KH','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(742,11,'Glpi\\Form\\Question','question_name','km_KH','{}','13fc108822413e5c9a9b177c353b8718'),
(743,12,'Glpi\\Form\\Question','question_name','km_KH','{\"one\":\"Observer\"}','afee7117d982a452a8a772b513c58412'),
(744,13,'Glpi\\Form\\Question','question_name','km_KH','{\"one\":\"Location\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(745,14,'Glpi\\Form\\Question','question_name','km_KH','{}','09b79d379db0c82b4615d749b22475f0'),
(746,14,'Glpi\\Form\\Question','question_default_value','km_KH','{}','d41d8cd98f00b204e9800998ecf8427e'),
(747,15,'Glpi\\Form\\Question','question_name','km_KH','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(748,16,'Glpi\\Form\\Question','question_name','km_KH','{}','270774c2dc685cc979a7d7a2426bf193'),
(749,1,'Glpi\\Form\\Form','form_name','kn','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(750,1,'Glpi\\Form\\Form','form_description','kn','{}','2794669861cc00408fef842e5cf6930a'),
(751,1,'Glpi\\Form\\Question','question_name','kn','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(752,2,'Glpi\\Form\\Question','question_name','kn','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(753,3,'Glpi\\Form\\Question','question_name','kn','{}','13fc108822413e5c9a9b177c353b8718'),
(754,4,'Glpi\\Form\\Question','question_name','kn','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(755,5,'Glpi\\Form\\Question','question_name','kn','{\"one\":\"\\u0cb8\\u0ccd\\u0ca5\\u0cb3\\u0c97\\u0cb3\\u0cc1\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(756,6,'Glpi\\Form\\Question','question_name','kn','{}','09b79d379db0c82b4615d749b22475f0'),
(757,6,'Glpi\\Form\\Question','question_default_value','kn','{}','d41d8cd98f00b204e9800998ecf8427e'),
(758,7,'Glpi\\Form\\Question','question_name','kn','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(759,8,'Glpi\\Form\\Question','question_name','kn','{}','270774c2dc685cc979a7d7a2426bf193'),
(760,2,'Glpi\\Form\\Form','form_name','kn','{}','99d2310dc614498390a30da92a419eb2'),
(761,2,'Glpi\\Form\\Form','form_description','kn','{}','fb1026f69a37a5b62523c53c03402d91'),
(762,9,'Glpi\\Form\\Question','question_name','kn','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(763,10,'Glpi\\Form\\Question','question_name','kn','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(764,11,'Glpi\\Form\\Question','question_name','kn','{}','13fc108822413e5c9a9b177c353b8718'),
(765,12,'Glpi\\Form\\Question','question_name','kn','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(766,13,'Glpi\\Form\\Question','question_name','kn','{\"one\":\"\\u0cb8\\u0ccd\\u0ca5\\u0cb3\\u0c97\\u0cb3\\u0cc1\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(767,14,'Glpi\\Form\\Question','question_name','kn','{}','09b79d379db0c82b4615d749b22475f0'),
(768,14,'Glpi\\Form\\Question','question_default_value','kn','{}','d41d8cd98f00b204e9800998ecf8427e'),
(769,15,'Glpi\\Form\\Question','question_name','kn','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(770,16,'Glpi\\Form\\Question','question_name','kn','{}','270774c2dc685cc979a7d7a2426bf193'),
(771,1,'Glpi\\Form\\Form','form_name','lv_LV','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(772,1,'Glpi\\Form\\Form','form_description','lv_LV','{}','2794669861cc00408fef842e5cf6930a'),
(773,1,'Glpi\\Form\\Question','question_name','lv_LV','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(774,2,'Glpi\\Form\\Question','question_name','lv_LV','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(775,3,'Glpi\\Form\\Question','question_name','lv_LV','{}','13fc108822413e5c9a9b177c353b8718'),
(776,4,'Glpi\\Form\\Question','question_name','lv_LV','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(777,5,'Glpi\\Form\\Question','question_name','lv_LV','{\"one\":\"Atra\\u0161an\\u0101s vietas\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(778,6,'Glpi\\Form\\Question','question_name','lv_LV','{}','09b79d379db0c82b4615d749b22475f0'),
(779,6,'Glpi\\Form\\Question','question_default_value','lv_LV','{}','d41d8cd98f00b204e9800998ecf8427e'),
(780,7,'Glpi\\Form\\Question','question_name','lv_LV','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(781,8,'Glpi\\Form\\Question','question_name','lv_LV','{}','270774c2dc685cc979a7d7a2426bf193'),
(782,2,'Glpi\\Form\\Form','form_name','lv_LV','{}','99d2310dc614498390a30da92a419eb2'),
(783,2,'Glpi\\Form\\Form','form_description','lv_LV','{}','fb1026f69a37a5b62523c53c03402d91'),
(784,9,'Glpi\\Form\\Question','question_name','lv_LV','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(785,10,'Glpi\\Form\\Question','question_name','lv_LV','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(786,11,'Glpi\\Form\\Question','question_name','lv_LV','{}','13fc108822413e5c9a9b177c353b8718'),
(787,12,'Glpi\\Form\\Question','question_name','lv_LV','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(788,13,'Glpi\\Form\\Question','question_name','lv_LV','{\"one\":\"Atra\\u0161an\\u0101s vietas\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(789,14,'Glpi\\Form\\Question','question_name','lv_LV','{}','09b79d379db0c82b4615d749b22475f0'),
(790,14,'Glpi\\Form\\Question','question_default_value','lv_LV','{}','d41d8cd98f00b204e9800998ecf8427e'),
(791,15,'Glpi\\Form\\Question','question_name','lv_LV','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(792,16,'Glpi\\Form\\Question','question_name','lv_LV','{}','270774c2dc685cc979a7d7a2426bf193'),
(793,1,'Glpi\\Form\\Form','form_name','lt_LT','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(794,1,'Glpi\\Form\\Form','form_description','lt_LT','{}','2794669861cc00408fef842e5cf6930a'),
(795,1,'Glpi\\Form\\Question','question_name','lt_LT','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(796,2,'Glpi\\Form\\Question','question_name','lt_LT','{\"one\":\"Kategorija\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(797,3,'Glpi\\Form\\Question','question_name','lt_LT','{}','13fc108822413e5c9a9b177c353b8718'),
(798,4,'Glpi\\Form\\Question','question_name','lt_LT','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(799,5,'Glpi\\Form\\Question','question_name','lt_LT','{\"one\":\"Vieta\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(800,6,'Glpi\\Form\\Question','question_name','lt_LT','{}','09b79d379db0c82b4615d749b22475f0'),
(801,6,'Glpi\\Form\\Question','question_default_value','lt_LT','{}','d41d8cd98f00b204e9800998ecf8427e'),
(802,7,'Glpi\\Form\\Question','question_name','lt_LT','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(803,8,'Glpi\\Form\\Question','question_name','lt_LT','{}','270774c2dc685cc979a7d7a2426bf193'),
(804,2,'Glpi\\Form\\Form','form_name','lt_LT','{}','99d2310dc614498390a30da92a419eb2'),
(805,2,'Glpi\\Form\\Form','form_description','lt_LT','{}','fb1026f69a37a5b62523c53c03402d91'),
(806,9,'Glpi\\Form\\Question','question_name','lt_LT','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(807,10,'Glpi\\Form\\Question','question_name','lt_LT','{\"one\":\"Kategorija\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(808,11,'Glpi\\Form\\Question','question_name','lt_LT','{}','13fc108822413e5c9a9b177c353b8718'),
(809,12,'Glpi\\Form\\Question','question_name','lt_LT','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(810,13,'Glpi\\Form\\Question','question_name','lt_LT','{\"one\":\"Vieta\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(811,14,'Glpi\\Form\\Question','question_name','lt_LT','{}','09b79d379db0c82b4615d749b22475f0'),
(812,14,'Glpi\\Form\\Question','question_default_value','lt_LT','{}','d41d8cd98f00b204e9800998ecf8427e'),
(813,15,'Glpi\\Form\\Question','question_name','lt_LT','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(814,16,'Glpi\\Form\\Question','question_name','lt_LT','{}','270774c2dc685cc979a7d7a2426bf193'),
(815,1,'Glpi\\Form\\Form','form_name','mn_MN','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(816,1,'Glpi\\Form\\Form','form_description','mn_MN','{}','2794669861cc00408fef842e5cf6930a'),
(817,1,'Glpi\\Form\\Question','question_name','mn_MN','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(818,2,'Glpi\\Form\\Question','question_name','mn_MN','{\"one\":\"\\u0410\\u043d\\u0433\\u0438\\u043b\\u0430\\u043b\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(819,3,'Glpi\\Form\\Question','question_name','mn_MN','{}','13fc108822413e5c9a9b177c353b8718'),
(820,4,'Glpi\\Form\\Question','question_name','mn_MN','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(821,5,'Glpi\\Form\\Question','question_name','mn_MN','{\"one\":\"\\u0411\\u0430\\u0439\\u0440\\u0448\\u0438\\u043b\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(822,6,'Glpi\\Form\\Question','question_name','mn_MN','{}','09b79d379db0c82b4615d749b22475f0'),
(823,6,'Glpi\\Form\\Question','question_default_value','mn_MN','{}','d41d8cd98f00b204e9800998ecf8427e'),
(824,7,'Glpi\\Form\\Question','question_name','mn_MN','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(825,8,'Glpi\\Form\\Question','question_name','mn_MN','{}','270774c2dc685cc979a7d7a2426bf193'),
(826,2,'Glpi\\Form\\Form','form_name','mn_MN','{}','99d2310dc614498390a30da92a419eb2'),
(827,2,'Glpi\\Form\\Form','form_description','mn_MN','{}','fb1026f69a37a5b62523c53c03402d91'),
(828,9,'Glpi\\Form\\Question','question_name','mn_MN','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(829,10,'Glpi\\Form\\Question','question_name','mn_MN','{\"one\":\"\\u0410\\u043d\\u0433\\u0438\\u043b\\u0430\\u043b\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(830,11,'Glpi\\Form\\Question','question_name','mn_MN','{}','13fc108822413e5c9a9b177c353b8718'),
(831,12,'Glpi\\Form\\Question','question_name','mn_MN','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(832,13,'Glpi\\Form\\Question','question_name','mn_MN','{\"one\":\"\\u0411\\u0430\\u0439\\u0440\\u0448\\u0438\\u043b\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(833,14,'Glpi\\Form\\Question','question_name','mn_MN','{}','09b79d379db0c82b4615d749b22475f0'),
(834,14,'Glpi\\Form\\Question','question_default_value','mn_MN','{}','d41d8cd98f00b204e9800998ecf8427e'),
(835,15,'Glpi\\Form\\Question','question_name','mn_MN','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(836,16,'Glpi\\Form\\Question','question_name','mn_MN','{}','270774c2dc685cc979a7d7a2426bf193'),
(837,1,'Glpi\\Form\\Form','form_name','nl_NL','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(838,1,'Glpi\\Form\\Form','form_description','nl_NL','{}','2794669861cc00408fef842e5cf6930a'),
(839,1,'Glpi\\Form\\Question','question_name','nl_NL','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(840,2,'Glpi\\Form\\Question','question_name','nl_NL','{\"one\":\"Categorie\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(841,3,'Glpi\\Form\\Question','question_name','nl_NL','{}','13fc108822413e5c9a9b177c353b8718'),
(842,4,'Glpi\\Form\\Question','question_name','nl_NL','{\"one\":\"Volgers\"}','afee7117d982a452a8a772b513c58412'),
(843,5,'Glpi\\Form\\Question','question_name','nl_NL','{\"one\":\"Locatie\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(844,6,'Glpi\\Form\\Question','question_name','nl_NL','{}','09b79d379db0c82b4615d749b22475f0'),
(845,6,'Glpi\\Form\\Question','question_default_value','nl_NL','{}','d41d8cd98f00b204e9800998ecf8427e'),
(846,7,'Glpi\\Form\\Question','question_name','nl_NL','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(847,8,'Glpi\\Form\\Question','question_name','nl_NL','{}','270774c2dc685cc979a7d7a2426bf193'),
(848,2,'Glpi\\Form\\Form','form_name','nl_NL','{}','99d2310dc614498390a30da92a419eb2'),
(849,2,'Glpi\\Form\\Form','form_description','nl_NL','{}','fb1026f69a37a5b62523c53c03402d91'),
(850,9,'Glpi\\Form\\Question','question_name','nl_NL','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(851,10,'Glpi\\Form\\Question','question_name','nl_NL','{\"one\":\"Categorie\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(852,11,'Glpi\\Form\\Question','question_name','nl_NL','{}','13fc108822413e5c9a9b177c353b8718'),
(853,12,'Glpi\\Form\\Question','question_name','nl_NL','{\"one\":\"Volgers\"}','afee7117d982a452a8a772b513c58412'),
(854,13,'Glpi\\Form\\Question','question_name','nl_NL','{\"one\":\"Locatie\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(855,14,'Glpi\\Form\\Question','question_name','nl_NL','{}','09b79d379db0c82b4615d749b22475f0'),
(856,14,'Glpi\\Form\\Question','question_default_value','nl_NL','{}','d41d8cd98f00b204e9800998ecf8427e'),
(857,15,'Glpi\\Form\\Question','question_name','nl_NL','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(858,16,'Glpi\\Form\\Question','question_name','nl_NL','{}','270774c2dc685cc979a7d7a2426bf193'),
(859,1,'Glpi\\Form\\Form','form_name','nl_BE','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(860,1,'Glpi\\Form\\Form','form_description','nl_BE','{}','2794669861cc00408fef842e5cf6930a'),
(861,1,'Glpi\\Form\\Question','question_name','nl_BE','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(862,2,'Glpi\\Form\\Question','question_name','nl_BE','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(863,3,'Glpi\\Form\\Question','question_name','nl_BE','{}','13fc108822413e5c9a9b177c353b8718'),
(864,4,'Glpi\\Form\\Question','question_name','nl_BE','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(865,5,'Glpi\\Form\\Question','question_name','nl_BE','{\"one\":\"Locatie\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(866,6,'Glpi\\Form\\Question','question_name','nl_BE','{}','09b79d379db0c82b4615d749b22475f0'),
(867,6,'Glpi\\Form\\Question','question_default_value','nl_BE','{}','d41d8cd98f00b204e9800998ecf8427e'),
(868,7,'Glpi\\Form\\Question','question_name','nl_BE','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(869,8,'Glpi\\Form\\Question','question_name','nl_BE','{}','270774c2dc685cc979a7d7a2426bf193'),
(870,2,'Glpi\\Form\\Form','form_name','nl_BE','{}','99d2310dc614498390a30da92a419eb2'),
(871,2,'Glpi\\Form\\Form','form_description','nl_BE','{}','fb1026f69a37a5b62523c53c03402d91'),
(872,9,'Glpi\\Form\\Question','question_name','nl_BE','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(873,10,'Glpi\\Form\\Question','question_name','nl_BE','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(874,11,'Glpi\\Form\\Question','question_name','nl_BE','{}','13fc108822413e5c9a9b177c353b8718'),
(875,12,'Glpi\\Form\\Question','question_name','nl_BE','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(876,13,'Glpi\\Form\\Question','question_name','nl_BE','{\"one\":\"Locatie\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(877,14,'Glpi\\Form\\Question','question_name','nl_BE','{}','09b79d379db0c82b4615d749b22475f0'),
(878,14,'Glpi\\Form\\Question','question_default_value','nl_BE','{}','d41d8cd98f00b204e9800998ecf8427e'),
(879,15,'Glpi\\Form\\Question','question_name','nl_BE','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(880,16,'Glpi\\Form\\Question','question_name','nl_BE','{}','270774c2dc685cc979a7d7a2426bf193'),
(881,1,'Glpi\\Form\\Form','form_name','nb_NO','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(882,1,'Glpi\\Form\\Form','form_description','nb_NO','{}','2794669861cc00408fef842e5cf6930a'),
(883,1,'Glpi\\Form\\Question','question_name','nb_NO','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(884,2,'Glpi\\Form\\Question','question_name','nb_NO','{\"one\":\"Kategori\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(885,3,'Glpi\\Form\\Question','question_name','nb_NO','{}','13fc108822413e5c9a9b177c353b8718'),
(886,4,'Glpi\\Form\\Question','question_name','nb_NO','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(887,5,'Glpi\\Form\\Question','question_name','nb_NO','{\"one\":\"Lokasjon\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(888,6,'Glpi\\Form\\Question','question_name','nb_NO','{}','09b79d379db0c82b4615d749b22475f0'),
(889,6,'Glpi\\Form\\Question','question_default_value','nb_NO','{}','d41d8cd98f00b204e9800998ecf8427e'),
(890,7,'Glpi\\Form\\Question','question_name','nb_NO','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(891,8,'Glpi\\Form\\Question','question_name','nb_NO','{}','270774c2dc685cc979a7d7a2426bf193'),
(892,2,'Glpi\\Form\\Form','form_name','nb_NO','{}','99d2310dc614498390a30da92a419eb2'),
(893,2,'Glpi\\Form\\Form','form_description','nb_NO','{}','fb1026f69a37a5b62523c53c03402d91'),
(894,9,'Glpi\\Form\\Question','question_name','nb_NO','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(895,10,'Glpi\\Form\\Question','question_name','nb_NO','{\"one\":\"Kategori\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(896,11,'Glpi\\Form\\Question','question_name','nb_NO','{}','13fc108822413e5c9a9b177c353b8718'),
(897,12,'Glpi\\Form\\Question','question_name','nb_NO','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(898,13,'Glpi\\Form\\Question','question_name','nb_NO','{\"one\":\"Lokasjon\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(899,14,'Glpi\\Form\\Question','question_name','nb_NO','{}','09b79d379db0c82b4615d749b22475f0'),
(900,14,'Glpi\\Form\\Question','question_default_value','nb_NO','{}','d41d8cd98f00b204e9800998ecf8427e'),
(901,15,'Glpi\\Form\\Question','question_name','nb_NO','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(902,16,'Glpi\\Form\\Question','question_name','nb_NO','{}','270774c2dc685cc979a7d7a2426bf193'),
(903,1,'Glpi\\Form\\Form','form_name','nn_NO','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(904,1,'Glpi\\Form\\Form','form_description','nn_NO','{}','2794669861cc00408fef842e5cf6930a'),
(905,1,'Glpi\\Form\\Question','question_name','nn_NO','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(906,2,'Glpi\\Form\\Question','question_name','nn_NO','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(907,3,'Glpi\\Form\\Question','question_name','nn_NO','{}','13fc108822413e5c9a9b177c353b8718'),
(908,4,'Glpi\\Form\\Question','question_name','nn_NO','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(909,5,'Glpi\\Form\\Question','question_name','nn_NO','{\"one\":\"Location\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(910,6,'Glpi\\Form\\Question','question_name','nn_NO','{}','09b79d379db0c82b4615d749b22475f0'),
(911,6,'Glpi\\Form\\Question','question_default_value','nn_NO','{}','d41d8cd98f00b204e9800998ecf8427e'),
(912,7,'Glpi\\Form\\Question','question_name','nn_NO','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(913,8,'Glpi\\Form\\Question','question_name','nn_NO','{}','270774c2dc685cc979a7d7a2426bf193'),
(914,2,'Glpi\\Form\\Form','form_name','nn_NO','{}','99d2310dc614498390a30da92a419eb2'),
(915,2,'Glpi\\Form\\Form','form_description','nn_NO','{}','fb1026f69a37a5b62523c53c03402d91'),
(916,9,'Glpi\\Form\\Question','question_name','nn_NO','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(917,10,'Glpi\\Form\\Question','question_name','nn_NO','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(918,11,'Glpi\\Form\\Question','question_name','nn_NO','{}','13fc108822413e5c9a9b177c353b8718'),
(919,12,'Glpi\\Form\\Question','question_name','nn_NO','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(920,13,'Glpi\\Form\\Question','question_name','nn_NO','{\"one\":\"Location\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(921,14,'Glpi\\Form\\Question','question_name','nn_NO','{}','09b79d379db0c82b4615d749b22475f0'),
(922,14,'Glpi\\Form\\Question','question_default_value','nn_NO','{}','d41d8cd98f00b204e9800998ecf8427e'),
(923,15,'Glpi\\Form\\Question','question_name','nn_NO','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(924,16,'Glpi\\Form\\Question','question_name','nn_NO','{}','270774c2dc685cc979a7d7a2426bf193'),
(925,1,'Glpi\\Form\\Form','form_name','fa_IR','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(926,1,'Glpi\\Form\\Form','form_description','fa_IR','{}','2794669861cc00408fef842e5cf6930a'),
(927,1,'Glpi\\Form\\Question','question_name','fa_IR','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(928,2,'Glpi\\Form\\Question','question_name','fa_IR','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(929,3,'Glpi\\Form\\Question','question_name','fa_IR','{}','13fc108822413e5c9a9b177c353b8718'),
(930,4,'Glpi\\Form\\Question','question_name','fa_IR','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(931,5,'Glpi\\Form\\Question','question_name','fa_IR','{\"one\":\"Location\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(932,6,'Glpi\\Form\\Question','question_name','fa_IR','{}','09b79d379db0c82b4615d749b22475f0'),
(933,6,'Glpi\\Form\\Question','question_default_value','fa_IR','{}','d41d8cd98f00b204e9800998ecf8427e'),
(934,7,'Glpi\\Form\\Question','question_name','fa_IR','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(935,8,'Glpi\\Form\\Question','question_name','fa_IR','{}','270774c2dc685cc979a7d7a2426bf193'),
(936,2,'Glpi\\Form\\Form','form_name','fa_IR','{}','99d2310dc614498390a30da92a419eb2'),
(937,2,'Glpi\\Form\\Form','form_description','fa_IR','{}','fb1026f69a37a5b62523c53c03402d91'),
(938,9,'Glpi\\Form\\Question','question_name','fa_IR','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(939,10,'Glpi\\Form\\Question','question_name','fa_IR','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(940,11,'Glpi\\Form\\Question','question_name','fa_IR','{}','13fc108822413e5c9a9b177c353b8718'),
(941,12,'Glpi\\Form\\Question','question_name','fa_IR','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(942,13,'Glpi\\Form\\Question','question_name','fa_IR','{\"one\":\"Location\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(943,14,'Glpi\\Form\\Question','question_name','fa_IR','{}','09b79d379db0c82b4615d749b22475f0'),
(944,14,'Glpi\\Form\\Question','question_default_value','fa_IR','{}','d41d8cd98f00b204e9800998ecf8427e'),
(945,15,'Glpi\\Form\\Question','question_name','fa_IR','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(946,16,'Glpi\\Form\\Question','question_name','fa_IR','{}','270774c2dc685cc979a7d7a2426bf193'),
(947,1,'Glpi\\Form\\Form','form_name','pl_PL','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(948,1,'Glpi\\Form\\Form','form_description','pl_PL','{}','2794669861cc00408fef842e5cf6930a'),
(949,1,'Glpi\\Form\\Question','question_name','pl_PL','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(950,2,'Glpi\\Form\\Question','question_name','pl_PL','{\"one\":\"Kategoria\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(951,3,'Glpi\\Form\\Question','question_name','pl_PL','{}','13fc108822413e5c9a9b177c353b8718'),
(952,4,'Glpi\\Form\\Question','question_name','pl_PL','{\"one\":\"Obserwatorzy\"}','afee7117d982a452a8a772b513c58412'),
(953,5,'Glpi\\Form\\Question','question_name','pl_PL','{\"one\":\"Lokalizacja\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(954,6,'Glpi\\Form\\Question','question_name','pl_PL','{}','09b79d379db0c82b4615d749b22475f0'),
(955,6,'Glpi\\Form\\Question','question_default_value','pl_PL','{}','d41d8cd98f00b204e9800998ecf8427e'),
(956,7,'Glpi\\Form\\Question','question_name','pl_PL','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(957,8,'Glpi\\Form\\Question','question_name','pl_PL','{}','270774c2dc685cc979a7d7a2426bf193'),
(958,2,'Glpi\\Form\\Form','form_name','pl_PL','{}','99d2310dc614498390a30da92a419eb2'),
(959,2,'Glpi\\Form\\Form','form_description','pl_PL','{}','fb1026f69a37a5b62523c53c03402d91'),
(960,9,'Glpi\\Form\\Question','question_name','pl_PL','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(961,10,'Glpi\\Form\\Question','question_name','pl_PL','{\"one\":\"Kategoria\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(962,11,'Glpi\\Form\\Question','question_name','pl_PL','{}','13fc108822413e5c9a9b177c353b8718'),
(963,12,'Glpi\\Form\\Question','question_name','pl_PL','{\"one\":\"Obserwatorzy\"}','afee7117d982a452a8a772b513c58412'),
(964,13,'Glpi\\Form\\Question','question_name','pl_PL','{\"one\":\"Lokalizacja\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(965,14,'Glpi\\Form\\Question','question_name','pl_PL','{}','09b79d379db0c82b4615d749b22475f0'),
(966,14,'Glpi\\Form\\Question','question_default_value','pl_PL','{}','d41d8cd98f00b204e9800998ecf8427e'),
(967,15,'Glpi\\Form\\Question','question_name','pl_PL','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(968,16,'Glpi\\Form\\Question','question_name','pl_PL','{}','270774c2dc685cc979a7d7a2426bf193'),
(969,1,'Glpi\\Form\\Form','form_name','pt_PT','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(970,1,'Glpi\\Form\\Form','form_description','pt_PT','{}','2794669861cc00408fef842e5cf6930a'),
(971,1,'Glpi\\Form\\Question','question_name','pt_PT','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(972,2,'Glpi\\Form\\Question','question_name','pt_PT','{\"one\":\"Categoria\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(973,3,'Glpi\\Form\\Question','question_name','pt_PT','{}','13fc108822413e5c9a9b177c353b8718'),
(974,4,'Glpi\\Form\\Question','question_name','pt_PT','{}','afee7117d982a452a8a772b513c58412'),
(975,5,'Glpi\\Form\\Question','question_name','pt_PT','{\"one\":\"Localiza\\u00e7\\u00e3o\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(976,6,'Glpi\\Form\\Question','question_name','pt_PT','{}','09b79d379db0c82b4615d749b22475f0'),
(977,6,'Glpi\\Form\\Question','question_default_value','pt_PT','{}','d41d8cd98f00b204e9800998ecf8427e'),
(978,7,'Glpi\\Form\\Question','question_name','pt_PT','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(979,8,'Glpi\\Form\\Question','question_name','pt_PT','{}','270774c2dc685cc979a7d7a2426bf193'),
(980,2,'Glpi\\Form\\Form','form_name','pt_PT','{}','99d2310dc614498390a30da92a419eb2'),
(981,2,'Glpi\\Form\\Form','form_description','pt_PT','{}','fb1026f69a37a5b62523c53c03402d91'),
(982,9,'Glpi\\Form\\Question','question_name','pt_PT','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(983,10,'Glpi\\Form\\Question','question_name','pt_PT','{\"one\":\"Categoria\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(984,11,'Glpi\\Form\\Question','question_name','pt_PT','{}','13fc108822413e5c9a9b177c353b8718'),
(985,12,'Glpi\\Form\\Question','question_name','pt_PT','{}','afee7117d982a452a8a772b513c58412'),
(986,13,'Glpi\\Form\\Question','question_name','pt_PT','{\"one\":\"Localiza\\u00e7\\u00e3o\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(987,14,'Glpi\\Form\\Question','question_name','pt_PT','{}','09b79d379db0c82b4615d749b22475f0'),
(988,14,'Glpi\\Form\\Question','question_default_value','pt_PT','{}','d41d8cd98f00b204e9800998ecf8427e'),
(989,15,'Glpi\\Form\\Question','question_name','pt_PT','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(990,16,'Glpi\\Form\\Question','question_name','pt_PT','{}','270774c2dc685cc979a7d7a2426bf193'),
(991,1,'Glpi\\Form\\Form','form_name','pt_BR','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(992,1,'Glpi\\Form\\Form','form_description','pt_BR','{}','2794669861cc00408fef842e5cf6930a'),
(993,1,'Glpi\\Form\\Question','question_name','pt_BR','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(994,2,'Glpi\\Form\\Question','question_name','pt_BR','{\"one\":\"Categoria\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(995,3,'Glpi\\Form\\Question','question_name','pt_BR','{}','13fc108822413e5c9a9b177c353b8718'),
(996,4,'Glpi\\Form\\Question','question_name','pt_BR','{}','afee7117d982a452a8a772b513c58412'),
(997,5,'Glpi\\Form\\Question','question_name','pt_BR','{\"one\":\"Localiza\\u00e7\\u00e3o\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(998,6,'Glpi\\Form\\Question','question_name','pt_BR','{}','09b79d379db0c82b4615d749b22475f0'),
(999,6,'Glpi\\Form\\Question','question_default_value','pt_BR','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1000,7,'Glpi\\Form\\Question','question_name','pt_BR','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1001,8,'Glpi\\Form\\Question','question_name','pt_BR','{}','270774c2dc685cc979a7d7a2426bf193'),
(1002,2,'Glpi\\Form\\Form','form_name','pt_BR','{}','99d2310dc614498390a30da92a419eb2'),
(1003,2,'Glpi\\Form\\Form','form_description','pt_BR','{}','fb1026f69a37a5b62523c53c03402d91'),
(1004,9,'Glpi\\Form\\Question','question_name','pt_BR','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1005,10,'Glpi\\Form\\Question','question_name','pt_BR','{\"one\":\"Categoria\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1006,11,'Glpi\\Form\\Question','question_name','pt_BR','{}','13fc108822413e5c9a9b177c353b8718'),
(1007,12,'Glpi\\Form\\Question','question_name','pt_BR','{}','afee7117d982a452a8a772b513c58412'),
(1008,13,'Glpi\\Form\\Question','question_name','pt_BR','{\"one\":\"Localiza\\u00e7\\u00e3o\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1009,14,'Glpi\\Form\\Question','question_name','pt_BR','{}','09b79d379db0c82b4615d749b22475f0'),
(1010,14,'Glpi\\Form\\Question','question_default_value','pt_BR','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1011,15,'Glpi\\Form\\Question','question_name','pt_BR','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1012,16,'Glpi\\Form\\Question','question_name','pt_BR','{}','270774c2dc685cc979a7d7a2426bf193'),
(1013,1,'Glpi\\Form\\Form','form_name','ro_RO','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(1014,1,'Glpi\\Form\\Form','form_description','ro_RO','{}','2794669861cc00408fef842e5cf6930a'),
(1015,1,'Glpi\\Form\\Question','question_name','ro_RO','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1016,2,'Glpi\\Form\\Question','question_name','ro_RO','{\"one\":\"Categorie\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1017,3,'Glpi\\Form\\Question','question_name','ro_RO','{}','13fc108822413e5c9a9b177c353b8718'),
(1018,4,'Glpi\\Form\\Question','question_name','ro_RO','{\"one\":\"Observatori\"}','afee7117d982a452a8a772b513c58412'),
(1019,5,'Glpi\\Form\\Question','question_name','ro_RO','{\"one\":\"Loca\\u0163ii\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1020,6,'Glpi\\Form\\Question','question_name','ro_RO','{}','09b79d379db0c82b4615d749b22475f0'),
(1021,6,'Glpi\\Form\\Question','question_default_value','ro_RO','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1022,7,'Glpi\\Form\\Question','question_name','ro_RO','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1023,8,'Glpi\\Form\\Question','question_name','ro_RO','{}','270774c2dc685cc979a7d7a2426bf193'),
(1024,2,'Glpi\\Form\\Form','form_name','ro_RO','{}','99d2310dc614498390a30da92a419eb2'),
(1025,2,'Glpi\\Form\\Form','form_description','ro_RO','{}','fb1026f69a37a5b62523c53c03402d91'),
(1026,9,'Glpi\\Form\\Question','question_name','ro_RO','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1027,10,'Glpi\\Form\\Question','question_name','ro_RO','{\"one\":\"Categorie\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1028,11,'Glpi\\Form\\Question','question_name','ro_RO','{}','13fc108822413e5c9a9b177c353b8718'),
(1029,12,'Glpi\\Form\\Question','question_name','ro_RO','{\"one\":\"Observatori\"}','afee7117d982a452a8a772b513c58412'),
(1030,13,'Glpi\\Form\\Question','question_name','ro_RO','{\"one\":\"Loca\\u0163ii\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1031,14,'Glpi\\Form\\Question','question_name','ro_RO','{}','09b79d379db0c82b4615d749b22475f0'),
(1032,14,'Glpi\\Form\\Question','question_default_value','ro_RO','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1033,15,'Glpi\\Form\\Question','question_name','ro_RO','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1034,16,'Glpi\\Form\\Question','question_name','ro_RO','{}','270774c2dc685cc979a7d7a2426bf193'),
(1035,1,'Glpi\\Form\\Form','form_name','ru_RU','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(1036,1,'Glpi\\Form\\Form','form_description','ru_RU','{}','2794669861cc00408fef842e5cf6930a'),
(1037,1,'Glpi\\Form\\Question','question_name','ru_RU','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1038,2,'Glpi\\Form\\Question','question_name','ru_RU','{\"one\":\"\\u041a\\u0430\\u0442\\u0435\\u0433\\u043e\\u0440\\u0438\\u044f\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1039,3,'Glpi\\Form\\Question','question_name','ru_RU','{}','13fc108822413e5c9a9b177c353b8718'),
(1040,4,'Glpi\\Form\\Question','question_name','ru_RU','{\"one\":\"\\u041d\\u0430\\u0431\\u043b\\u044e\\u0434\\u0430\\u0442\\u0435\\u043b\\u044f\"}','afee7117d982a452a8a772b513c58412'),
(1041,5,'Glpi\\Form\\Question','question_name','ru_RU','{\"one\":\"\\u041c\\u0435\\u0441\\u0442\\u043e\\u043f\\u043e\\u043b\\u043e\\u0436\\u0435\\u043d\\u0438\\u0435\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1042,6,'Glpi\\Form\\Question','question_name','ru_RU','{}','09b79d379db0c82b4615d749b22475f0'),
(1043,6,'Glpi\\Form\\Question','question_default_value','ru_RU','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1044,7,'Glpi\\Form\\Question','question_name','ru_RU','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1045,8,'Glpi\\Form\\Question','question_name','ru_RU','{}','270774c2dc685cc979a7d7a2426bf193'),
(1046,2,'Glpi\\Form\\Form','form_name','ru_RU','{}','99d2310dc614498390a30da92a419eb2'),
(1047,2,'Glpi\\Form\\Form','form_description','ru_RU','{}','fb1026f69a37a5b62523c53c03402d91'),
(1048,9,'Glpi\\Form\\Question','question_name','ru_RU','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1049,10,'Glpi\\Form\\Question','question_name','ru_RU','{\"one\":\"\\u041a\\u0430\\u0442\\u0435\\u0433\\u043e\\u0440\\u0438\\u044f\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1050,11,'Glpi\\Form\\Question','question_name','ru_RU','{}','13fc108822413e5c9a9b177c353b8718'),
(1051,12,'Glpi\\Form\\Question','question_name','ru_RU','{\"one\":\"\\u041d\\u0430\\u0431\\u043b\\u044e\\u0434\\u0430\\u0442\\u0435\\u043b\\u044f\"}','afee7117d982a452a8a772b513c58412'),
(1052,13,'Glpi\\Form\\Question','question_name','ru_RU','{\"one\":\"\\u041c\\u0435\\u0441\\u0442\\u043e\\u043f\\u043e\\u043b\\u043e\\u0436\\u0435\\u043d\\u0438\\u0435\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1053,14,'Glpi\\Form\\Question','question_name','ru_RU','{}','09b79d379db0c82b4615d749b22475f0'),
(1054,14,'Glpi\\Form\\Question','question_default_value','ru_RU','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1055,15,'Glpi\\Form\\Question','question_name','ru_RU','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1056,16,'Glpi\\Form\\Question','question_name','ru_RU','{}','270774c2dc685cc979a7d7a2426bf193'),
(1057,1,'Glpi\\Form\\Form','form_name','sk_SK','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(1058,1,'Glpi\\Form\\Form','form_description','sk_SK','{}','2794669861cc00408fef842e5cf6930a'),
(1059,1,'Glpi\\Form\\Question','question_name','sk_SK','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1060,2,'Glpi\\Form\\Question','question_name','sk_SK','{\"one\":\"Kateg\\u00f3ria\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1061,3,'Glpi\\Form\\Question','question_name','sk_SK','{}','13fc108822413e5c9a9b177c353b8718'),
(1062,4,'Glpi\\Form\\Question','question_name','sk_SK','{\"one\":\"Pozorovatelia\"}','afee7117d982a452a8a772b513c58412'),
(1063,5,'Glpi\\Form\\Question','question_name','sk_SK','{\"one\":\"Umiestnenie\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1064,6,'Glpi\\Form\\Question','question_name','sk_SK','{}','09b79d379db0c82b4615d749b22475f0'),
(1065,6,'Glpi\\Form\\Question','question_default_value','sk_SK','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1066,7,'Glpi\\Form\\Question','question_name','sk_SK','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1067,8,'Glpi\\Form\\Question','question_name','sk_SK','{}','270774c2dc685cc979a7d7a2426bf193'),
(1068,2,'Glpi\\Form\\Form','form_name','sk_SK','{}','99d2310dc614498390a30da92a419eb2'),
(1069,2,'Glpi\\Form\\Form','form_description','sk_SK','{}','fb1026f69a37a5b62523c53c03402d91'),
(1070,9,'Glpi\\Form\\Question','question_name','sk_SK','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1071,10,'Glpi\\Form\\Question','question_name','sk_SK','{\"one\":\"Kateg\\u00f3ria\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1072,11,'Glpi\\Form\\Question','question_name','sk_SK','{}','13fc108822413e5c9a9b177c353b8718'),
(1073,12,'Glpi\\Form\\Question','question_name','sk_SK','{\"one\":\"Pozorovatelia\"}','afee7117d982a452a8a772b513c58412'),
(1074,13,'Glpi\\Form\\Question','question_name','sk_SK','{\"one\":\"Umiestnenie\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1075,14,'Glpi\\Form\\Question','question_name','sk_SK','{}','09b79d379db0c82b4615d749b22475f0'),
(1076,14,'Glpi\\Form\\Question','question_default_value','sk_SK','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1077,15,'Glpi\\Form\\Question','question_name','sk_SK','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1078,16,'Glpi\\Form\\Question','question_name','sk_SK','{}','270774c2dc685cc979a7d7a2426bf193'),
(1079,1,'Glpi\\Form\\Form','form_name','sl_SI','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(1080,1,'Glpi\\Form\\Form','form_description','sl_SI','{}','2794669861cc00408fef842e5cf6930a'),
(1081,1,'Glpi\\Form\\Question','question_name','sl_SI','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1082,2,'Glpi\\Form\\Question','question_name','sl_SI','{\"one\":\"Kategorija\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1083,3,'Glpi\\Form\\Question','question_name','sl_SI','{}','13fc108822413e5c9a9b177c353b8718'),
(1084,4,'Glpi\\Form\\Question','question_name','sl_SI','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(1085,5,'Glpi\\Form\\Question','question_name','sl_SI','{\"one\":\"Lokacija\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1086,6,'Glpi\\Form\\Question','question_name','sl_SI','{}','09b79d379db0c82b4615d749b22475f0'),
(1087,6,'Glpi\\Form\\Question','question_default_value','sl_SI','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1088,7,'Glpi\\Form\\Question','question_name','sl_SI','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1089,8,'Glpi\\Form\\Question','question_name','sl_SI','{}','270774c2dc685cc979a7d7a2426bf193'),
(1090,2,'Glpi\\Form\\Form','form_name','sl_SI','{}','99d2310dc614498390a30da92a419eb2'),
(1091,2,'Glpi\\Form\\Form','form_description','sl_SI','{}','fb1026f69a37a5b62523c53c03402d91'),
(1092,9,'Glpi\\Form\\Question','question_name','sl_SI','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1093,10,'Glpi\\Form\\Question','question_name','sl_SI','{\"one\":\"Kategorija\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1094,11,'Glpi\\Form\\Question','question_name','sl_SI','{}','13fc108822413e5c9a9b177c353b8718'),
(1095,12,'Glpi\\Form\\Question','question_name','sl_SI','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(1096,13,'Glpi\\Form\\Question','question_name','sl_SI','{\"one\":\"Lokacija\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1097,14,'Glpi\\Form\\Question','question_name','sl_SI','{}','09b79d379db0c82b4615d749b22475f0'),
(1098,14,'Glpi\\Form\\Question','question_default_value','sl_SI','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1099,15,'Glpi\\Form\\Question','question_name','sl_SI','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1100,16,'Glpi\\Form\\Question','question_name','sl_SI','{}','270774c2dc685cc979a7d7a2426bf193'),
(1101,1,'Glpi\\Form\\Form','form_name','sq_AL','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(1102,1,'Glpi\\Form\\Form','form_description','sq_AL','{}','2794669861cc00408fef842e5cf6930a'),
(1103,1,'Glpi\\Form\\Question','question_name','sq_AL','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1104,2,'Glpi\\Form\\Question','question_name','sq_AL','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1105,3,'Glpi\\Form\\Question','question_name','sq_AL','{}','13fc108822413e5c9a9b177c353b8718'),
(1106,4,'Glpi\\Form\\Question','question_name','sq_AL','{\"one\":\"V\\u00ebzhguesit\"}','afee7117d982a452a8a772b513c58412'),
(1107,5,'Glpi\\Form\\Question','question_name','sq_AL','{\"one\":\"Location\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1108,6,'Glpi\\Form\\Question','question_name','sq_AL','{}','09b79d379db0c82b4615d749b22475f0'),
(1109,6,'Glpi\\Form\\Question','question_default_value','sq_AL','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1110,7,'Glpi\\Form\\Question','question_name','sq_AL','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1111,8,'Glpi\\Form\\Question','question_name','sq_AL','{}','270774c2dc685cc979a7d7a2426bf193'),
(1112,2,'Glpi\\Form\\Form','form_name','sq_AL','{}','99d2310dc614498390a30da92a419eb2'),
(1113,2,'Glpi\\Form\\Form','form_description','sq_AL','{}','fb1026f69a37a5b62523c53c03402d91'),
(1114,9,'Glpi\\Form\\Question','question_name','sq_AL','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1115,10,'Glpi\\Form\\Question','question_name','sq_AL','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1116,11,'Glpi\\Form\\Question','question_name','sq_AL','{}','13fc108822413e5c9a9b177c353b8718'),
(1117,12,'Glpi\\Form\\Question','question_name','sq_AL','{\"one\":\"V\\u00ebzhguesit\"}','afee7117d982a452a8a772b513c58412'),
(1118,13,'Glpi\\Form\\Question','question_name','sq_AL','{\"one\":\"Location\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1119,14,'Glpi\\Form\\Question','question_name','sq_AL','{}','09b79d379db0c82b4615d749b22475f0'),
(1120,14,'Glpi\\Form\\Question','question_default_value','sq_AL','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1121,15,'Glpi\\Form\\Question','question_name','sq_AL','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1122,16,'Glpi\\Form\\Question','question_name','sq_AL','{}','270774c2dc685cc979a7d7a2426bf193'),
(1123,1,'Glpi\\Form\\Form','form_name','sr_RS','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(1124,1,'Glpi\\Form\\Form','form_description','sr_RS','{}','2794669861cc00408fef842e5cf6930a'),
(1125,1,'Glpi\\Form\\Question','question_name','sr_RS','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1126,2,'Glpi\\Form\\Question','question_name','sr_RS','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1127,3,'Glpi\\Form\\Question','question_name','sr_RS','{}','13fc108822413e5c9a9b177c353b8718'),
(1128,4,'Glpi\\Form\\Question','question_name','sr_RS','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(1129,5,'Glpi\\Form\\Question','question_name','sr_RS','{\"one\":\"Lokacije\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1130,6,'Glpi\\Form\\Question','question_name','sr_RS','{}','09b79d379db0c82b4615d749b22475f0'),
(1131,6,'Glpi\\Form\\Question','question_default_value','sr_RS','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1132,7,'Glpi\\Form\\Question','question_name','sr_RS','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1133,8,'Glpi\\Form\\Question','question_name','sr_RS','{}','270774c2dc685cc979a7d7a2426bf193'),
(1134,2,'Glpi\\Form\\Form','form_name','sr_RS','{}','99d2310dc614498390a30da92a419eb2'),
(1135,2,'Glpi\\Form\\Form','form_description','sr_RS','{}','fb1026f69a37a5b62523c53c03402d91'),
(1136,9,'Glpi\\Form\\Question','question_name','sr_RS','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1137,10,'Glpi\\Form\\Question','question_name','sr_RS','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1138,11,'Glpi\\Form\\Question','question_name','sr_RS','{}','13fc108822413e5c9a9b177c353b8718'),
(1139,12,'Glpi\\Form\\Question','question_name','sr_RS','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(1140,13,'Glpi\\Form\\Question','question_name','sr_RS','{\"one\":\"Lokacije\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1141,14,'Glpi\\Form\\Question','question_name','sr_RS','{}','09b79d379db0c82b4615d749b22475f0'),
(1142,14,'Glpi\\Form\\Question','question_default_value','sr_RS','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1143,15,'Glpi\\Form\\Question','question_name','sr_RS','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1144,16,'Glpi\\Form\\Question','question_name','sr_RS','{}','270774c2dc685cc979a7d7a2426bf193'),
(1145,1,'Glpi\\Form\\Form','form_name','fi_FI','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(1146,1,'Glpi\\Form\\Form','form_description','fi_FI','{}','2794669861cc00408fef842e5cf6930a'),
(1147,1,'Glpi\\Form\\Question','question_name','fi_FI','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1148,2,'Glpi\\Form\\Question','question_name','fi_FI','{\"one\":\"Kategoria\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1149,3,'Glpi\\Form\\Question','question_name','fi_FI','{}','13fc108822413e5c9a9b177c353b8718'),
(1150,4,'Glpi\\Form\\Question','question_name','fi_FI','{\"one\":\"Tarkkailijat\"}','afee7117d982a452a8a772b513c58412'),
(1151,5,'Glpi\\Form\\Question','question_name','fi_FI','{\"one\":\"Sijainti\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1152,6,'Glpi\\Form\\Question','question_name','fi_FI','{}','09b79d379db0c82b4615d749b22475f0'),
(1153,6,'Glpi\\Form\\Question','question_default_value','fi_FI','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1154,7,'Glpi\\Form\\Question','question_name','fi_FI','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1155,8,'Glpi\\Form\\Question','question_name','fi_FI','{}','270774c2dc685cc979a7d7a2426bf193'),
(1156,2,'Glpi\\Form\\Form','form_name','fi_FI','{}','99d2310dc614498390a30da92a419eb2'),
(1157,2,'Glpi\\Form\\Form','form_description','fi_FI','{}','fb1026f69a37a5b62523c53c03402d91'),
(1158,9,'Glpi\\Form\\Question','question_name','fi_FI','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1159,10,'Glpi\\Form\\Question','question_name','fi_FI','{\"one\":\"Kategoria\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1160,11,'Glpi\\Form\\Question','question_name','fi_FI','{}','13fc108822413e5c9a9b177c353b8718'),
(1161,12,'Glpi\\Form\\Question','question_name','fi_FI','{\"one\":\"Tarkkailijat\"}','afee7117d982a452a8a772b513c58412'),
(1162,13,'Glpi\\Form\\Question','question_name','fi_FI','{\"one\":\"Sijainti\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1163,14,'Glpi\\Form\\Question','question_name','fi_FI','{}','09b79d379db0c82b4615d749b22475f0'),
(1164,14,'Glpi\\Form\\Question','question_default_value','fi_FI','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1165,15,'Glpi\\Form\\Question','question_name','fi_FI','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1166,16,'Glpi\\Form\\Question','question_name','fi_FI','{}','270774c2dc685cc979a7d7a2426bf193'),
(1167,1,'Glpi\\Form\\Form','form_name','sv_SE','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(1168,1,'Glpi\\Form\\Form','form_description','sv_SE','{}','2794669861cc00408fef842e5cf6930a'),
(1169,1,'Glpi\\Form\\Question','question_name','sv_SE','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1170,2,'Glpi\\Form\\Question','question_name','sv_SE','{\"one\":\"Kategori\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1171,3,'Glpi\\Form\\Question','question_name','sv_SE','{}','13fc108822413e5c9a9b177c353b8718'),
(1172,4,'Glpi\\Form\\Question','question_name','sv_SE','{\"one\":\"Observat\\u00f6rer\"}','afee7117d982a452a8a772b513c58412'),
(1173,5,'Glpi\\Form\\Question','question_name','sv_SE','{\"one\":\"Plats\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1174,6,'Glpi\\Form\\Question','question_name','sv_SE','{}','09b79d379db0c82b4615d749b22475f0'),
(1175,6,'Glpi\\Form\\Question','question_default_value','sv_SE','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1176,7,'Glpi\\Form\\Question','question_name','sv_SE','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1177,8,'Glpi\\Form\\Question','question_name','sv_SE','{}','270774c2dc685cc979a7d7a2426bf193'),
(1178,2,'Glpi\\Form\\Form','form_name','sv_SE','{}','99d2310dc614498390a30da92a419eb2'),
(1179,2,'Glpi\\Form\\Form','form_description','sv_SE','{}','fb1026f69a37a5b62523c53c03402d91'),
(1180,9,'Glpi\\Form\\Question','question_name','sv_SE','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1181,10,'Glpi\\Form\\Question','question_name','sv_SE','{\"one\":\"Kategori\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1182,11,'Glpi\\Form\\Question','question_name','sv_SE','{}','13fc108822413e5c9a9b177c353b8718'),
(1183,12,'Glpi\\Form\\Question','question_name','sv_SE','{\"one\":\"Observat\\u00f6rer\"}','afee7117d982a452a8a772b513c58412'),
(1184,13,'Glpi\\Form\\Question','question_name','sv_SE','{\"one\":\"Plats\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1185,14,'Glpi\\Form\\Question','question_name','sv_SE','{}','09b79d379db0c82b4615d749b22475f0'),
(1186,14,'Glpi\\Form\\Question','question_default_value','sv_SE','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1187,15,'Glpi\\Form\\Question','question_name','sv_SE','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1188,16,'Glpi\\Form\\Question','question_name','sv_SE','{}','270774c2dc685cc979a7d7a2426bf193'),
(1189,1,'Glpi\\Form\\Form','form_name','vi_VN','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(1190,1,'Glpi\\Form\\Form','form_description','vi_VN','{}','2794669861cc00408fef842e5cf6930a'),
(1191,1,'Glpi\\Form\\Question','question_name','vi_VN','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1192,2,'Glpi\\Form\\Question','question_name','vi_VN','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1193,3,'Glpi\\Form\\Question','question_name','vi_VN','{}','13fc108822413e5c9a9b177c353b8718'),
(1194,4,'Glpi\\Form\\Question','question_name','vi_VN','{\"one\":\"Observer\"}','afee7117d982a452a8a772b513c58412'),
(1195,5,'Glpi\\Form\\Question','question_name','vi_VN','{\"one\":\"V\\u1ecb tr\\u00ed\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1196,6,'Glpi\\Form\\Question','question_name','vi_VN','{}','09b79d379db0c82b4615d749b22475f0'),
(1197,6,'Glpi\\Form\\Question','question_default_value','vi_VN','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1198,7,'Glpi\\Form\\Question','question_name','vi_VN','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1199,8,'Glpi\\Form\\Question','question_name','vi_VN','{}','270774c2dc685cc979a7d7a2426bf193'),
(1200,2,'Glpi\\Form\\Form','form_name','vi_VN','{}','99d2310dc614498390a30da92a419eb2'),
(1201,2,'Glpi\\Form\\Form','form_description','vi_VN','{}','fb1026f69a37a5b62523c53c03402d91'),
(1202,9,'Glpi\\Form\\Question','question_name','vi_VN','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1203,10,'Glpi\\Form\\Question','question_name','vi_VN','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1204,11,'Glpi\\Form\\Question','question_name','vi_VN','{}','13fc108822413e5c9a9b177c353b8718'),
(1205,12,'Glpi\\Form\\Question','question_name','vi_VN','{\"one\":\"Observer\"}','afee7117d982a452a8a772b513c58412'),
(1206,13,'Glpi\\Form\\Question','question_name','vi_VN','{\"one\":\"V\\u1ecb tr\\u00ed\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1207,14,'Glpi\\Form\\Question','question_name','vi_VN','{}','09b79d379db0c82b4615d749b22475f0'),
(1208,14,'Glpi\\Form\\Question','question_default_value','vi_VN','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1209,15,'Glpi\\Form\\Question','question_name','vi_VN','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1210,16,'Glpi\\Form\\Question','question_name','vi_VN','{}','270774c2dc685cc979a7d7a2426bf193'),
(1211,1,'Glpi\\Form\\Form','form_name','th_TH','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(1212,1,'Glpi\\Form\\Form','form_description','th_TH','{}','2794669861cc00408fef842e5cf6930a'),
(1213,1,'Glpi\\Form\\Question','question_name','th_TH','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1214,2,'Glpi\\Form\\Question','question_name','th_TH','{\"one\":\"\\u0e2b\\u0e21\\u0e27\\u0e14\\u0e2b\\u0e21\\u0e39\\u0e48\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1215,3,'Glpi\\Form\\Question','question_name','th_TH','{}','13fc108822413e5c9a9b177c353b8718'),
(1216,4,'Glpi\\Form\\Question','question_name','th_TH','{\"one\":\"\\u0e1c\\u0e39\\u0e49\\u0e2a\\u0e31\\u0e07\\u0e40\\u0e01\\u0e15\\u0e01\\u0e32\\u0e23\\u0e13\\u0e4c\"}','afee7117d982a452a8a772b513c58412'),
(1217,5,'Glpi\\Form\\Question','question_name','th_TH','{\"one\":\"\\u0e2a\\u0e16\\u0e32\\u0e19\\u0e17\\u0e35\\u0e48\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1218,6,'Glpi\\Form\\Question','question_name','th_TH','{}','09b79d379db0c82b4615d749b22475f0'),
(1219,6,'Glpi\\Form\\Question','question_default_value','th_TH','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1220,7,'Glpi\\Form\\Question','question_name','th_TH','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1221,8,'Glpi\\Form\\Question','question_name','th_TH','{}','270774c2dc685cc979a7d7a2426bf193'),
(1222,2,'Glpi\\Form\\Form','form_name','th_TH','{}','99d2310dc614498390a30da92a419eb2'),
(1223,2,'Glpi\\Form\\Form','form_description','th_TH','{}','fb1026f69a37a5b62523c53c03402d91'),
(1224,9,'Glpi\\Form\\Question','question_name','th_TH','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1225,10,'Glpi\\Form\\Question','question_name','th_TH','{\"one\":\"\\u0e2b\\u0e21\\u0e27\\u0e14\\u0e2b\\u0e21\\u0e39\\u0e48\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1226,11,'Glpi\\Form\\Question','question_name','th_TH','{}','13fc108822413e5c9a9b177c353b8718'),
(1227,12,'Glpi\\Form\\Question','question_name','th_TH','{\"one\":\"\\u0e1c\\u0e39\\u0e49\\u0e2a\\u0e31\\u0e07\\u0e40\\u0e01\\u0e15\\u0e01\\u0e32\\u0e23\\u0e13\\u0e4c\"}','afee7117d982a452a8a772b513c58412'),
(1228,13,'Glpi\\Form\\Question','question_name','th_TH','{\"one\":\"\\u0e2a\\u0e16\\u0e32\\u0e19\\u0e17\\u0e35\\u0e48\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1229,14,'Glpi\\Form\\Question','question_name','th_TH','{}','09b79d379db0c82b4615d749b22475f0'),
(1230,14,'Glpi\\Form\\Question','question_default_value','th_TH','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1231,15,'Glpi\\Form\\Question','question_name','th_TH','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1232,16,'Glpi\\Form\\Question','question_name','th_TH','{}','270774c2dc685cc979a7d7a2426bf193'),
(1233,1,'Glpi\\Form\\Form','form_name','tr_TR','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(1234,1,'Glpi\\Form\\Form','form_description','tr_TR','{}','2794669861cc00408fef842e5cf6930a'),
(1235,1,'Glpi\\Form\\Question','question_name','tr_TR','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1236,2,'Glpi\\Form\\Question','question_name','tr_TR','{\"one\":\"Kategori\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1237,3,'Glpi\\Form\\Question','question_name','tr_TR','{}','13fc108822413e5c9a9b177c353b8718'),
(1238,4,'Glpi\\Form\\Question','question_name','tr_TR','{\"one\":\"G\\u00f6zlemciler\"}','afee7117d982a452a8a772b513c58412'),
(1239,5,'Glpi\\Form\\Question','question_name','tr_TR','{\"one\":\"Konum\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1240,6,'Glpi\\Form\\Question','question_name','tr_TR','{}','09b79d379db0c82b4615d749b22475f0'),
(1241,6,'Glpi\\Form\\Question','question_default_value','tr_TR','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1242,7,'Glpi\\Form\\Question','question_name','tr_TR','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1243,8,'Glpi\\Form\\Question','question_name','tr_TR','{}','270774c2dc685cc979a7d7a2426bf193'),
(1244,2,'Glpi\\Form\\Form','form_name','tr_TR','{}','99d2310dc614498390a30da92a419eb2'),
(1245,2,'Glpi\\Form\\Form','form_description','tr_TR','{}','fb1026f69a37a5b62523c53c03402d91'),
(1246,9,'Glpi\\Form\\Question','question_name','tr_TR','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1247,10,'Glpi\\Form\\Question','question_name','tr_TR','{\"one\":\"Kategori\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1248,11,'Glpi\\Form\\Question','question_name','tr_TR','{}','13fc108822413e5c9a9b177c353b8718'),
(1249,12,'Glpi\\Form\\Question','question_name','tr_TR','{\"one\":\"G\\u00f6zlemciler\"}','afee7117d982a452a8a772b513c58412'),
(1250,13,'Glpi\\Form\\Question','question_name','tr_TR','{\"one\":\"Konum\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1251,14,'Glpi\\Form\\Question','question_name','tr_TR','{}','09b79d379db0c82b4615d749b22475f0'),
(1252,14,'Glpi\\Form\\Question','question_default_value','tr_TR','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1253,15,'Glpi\\Form\\Question','question_name','tr_TR','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1254,16,'Glpi\\Form\\Question','question_name','tr_TR','{}','270774c2dc685cc979a7d7a2426bf193'),
(1255,1,'Glpi\\Form\\Form','form_name','uk_UA','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(1256,1,'Glpi\\Form\\Form','form_description','uk_UA','{}','2794669861cc00408fef842e5cf6930a'),
(1257,1,'Glpi\\Form\\Question','question_name','uk_UA','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1258,2,'Glpi\\Form\\Question','question_name','uk_UA','{\"one\":\"\\u041a\\u0430\\u0442\\u0435\\u0433\\u043e\\u0440\\u0456\\u044f\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1259,3,'Glpi\\Form\\Question','question_name','uk_UA','{}','13fc108822413e5c9a9b177c353b8718'),
(1260,4,'Glpi\\Form\\Question','question_name','uk_UA','{\"one\":\"\\u0421\\u043f\\u043e\\u0441\\u0442\\u0435\\u0440\\u0456\\u0433\\u0430\\u0447\\u0456\"}','afee7117d982a452a8a772b513c58412'),
(1261,5,'Glpi\\Form\\Question','question_name','uk_UA','{\"one\":\"\\u041c\\u0456\\u0441\\u0446\\u0435\\u0437\\u043d\\u0430\\u0445\\u043e\\u0434\\u0436\\u0435\\u043d\\u043d\\u044f\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1262,6,'Glpi\\Form\\Question','question_name','uk_UA','{}','09b79d379db0c82b4615d749b22475f0'),
(1263,6,'Glpi\\Form\\Question','question_default_value','uk_UA','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1264,7,'Glpi\\Form\\Question','question_name','uk_UA','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1265,8,'Glpi\\Form\\Question','question_name','uk_UA','{}','270774c2dc685cc979a7d7a2426bf193'),
(1266,2,'Glpi\\Form\\Form','form_name','uk_UA','{}','99d2310dc614498390a30da92a419eb2'),
(1267,2,'Glpi\\Form\\Form','form_description','uk_UA','{}','fb1026f69a37a5b62523c53c03402d91'),
(1268,9,'Glpi\\Form\\Question','question_name','uk_UA','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1269,10,'Glpi\\Form\\Question','question_name','uk_UA','{\"one\":\"\\u041a\\u0430\\u0442\\u0435\\u0433\\u043e\\u0440\\u0456\\u044f\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1270,11,'Glpi\\Form\\Question','question_name','uk_UA','{}','13fc108822413e5c9a9b177c353b8718'),
(1271,12,'Glpi\\Form\\Question','question_name','uk_UA','{\"one\":\"\\u0421\\u043f\\u043e\\u0441\\u0442\\u0435\\u0440\\u0456\\u0433\\u0430\\u0447\\u0456\"}','afee7117d982a452a8a772b513c58412'),
(1272,13,'Glpi\\Form\\Question','question_name','uk_UA','{\"one\":\"\\u041c\\u0456\\u0441\\u0446\\u0435\\u0437\\u043d\\u0430\\u0445\\u043e\\u0434\\u0436\\u0435\\u043d\\u043d\\u044f\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1273,14,'Glpi\\Form\\Question','question_name','uk_UA','{}','09b79d379db0c82b4615d749b22475f0'),
(1274,14,'Glpi\\Form\\Question','question_default_value','uk_UA','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1275,15,'Glpi\\Form\\Question','question_name','uk_UA','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1276,16,'Glpi\\Form\\Question','question_name','uk_UA','{}','270774c2dc685cc979a7d7a2426bf193'),
(1277,1,'Glpi\\Form\\Form','form_name','ja_JP','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(1278,1,'Glpi\\Form\\Form','form_description','ja_JP','{}','2794669861cc00408fef842e5cf6930a'),
(1279,1,'Glpi\\Form\\Question','question_name','ja_JP','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1280,2,'Glpi\\Form\\Question','question_name','ja_JP','{\"one\":\"\\u30ab\\u30c6\\u30b4\\u30ea\\u30fc\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1281,3,'Glpi\\Form\\Question','question_name','ja_JP','{}','13fc108822413e5c9a9b177c353b8718'),
(1282,4,'Glpi\\Form\\Question','question_name','ja_JP','{\"one\":\"\\u95a2\\u4fc2\\u8005\"}','afee7117d982a452a8a772b513c58412'),
(1283,5,'Glpi\\Form\\Question','question_name','ja_JP','{\"one\":\"\\u5834\\u6240\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1284,6,'Glpi\\Form\\Question','question_name','ja_JP','{}','09b79d379db0c82b4615d749b22475f0'),
(1285,6,'Glpi\\Form\\Question','question_default_value','ja_JP','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1286,7,'Glpi\\Form\\Question','question_name','ja_JP','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1287,8,'Glpi\\Form\\Question','question_name','ja_JP','{}','270774c2dc685cc979a7d7a2426bf193'),
(1288,2,'Glpi\\Form\\Form','form_name','ja_JP','{}','99d2310dc614498390a30da92a419eb2'),
(1289,2,'Glpi\\Form\\Form','form_description','ja_JP','{}','fb1026f69a37a5b62523c53c03402d91'),
(1290,9,'Glpi\\Form\\Question','question_name','ja_JP','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1291,10,'Glpi\\Form\\Question','question_name','ja_JP','{\"one\":\"\\u30ab\\u30c6\\u30b4\\u30ea\\u30fc\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1292,11,'Glpi\\Form\\Question','question_name','ja_JP','{}','13fc108822413e5c9a9b177c353b8718'),
(1293,12,'Glpi\\Form\\Question','question_name','ja_JP','{\"one\":\"\\u95a2\\u4fc2\\u8005\"}','afee7117d982a452a8a772b513c58412'),
(1294,13,'Glpi\\Form\\Question','question_name','ja_JP','{\"one\":\"\\u5834\\u6240\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1295,14,'Glpi\\Form\\Question','question_name','ja_JP','{}','09b79d379db0c82b4615d749b22475f0'),
(1296,14,'Glpi\\Form\\Question','question_default_value','ja_JP','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1297,15,'Glpi\\Form\\Question','question_name','ja_JP','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1298,16,'Glpi\\Form\\Question','question_name','ja_JP','{}','270774c2dc685cc979a7d7a2426bf193'),
(1299,1,'Glpi\\Form\\Form','form_name','zh_CN','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(1300,1,'Glpi\\Form\\Form','form_description','zh_CN','{}','2794669861cc00408fef842e5cf6930a'),
(1301,1,'Glpi\\Form\\Question','question_name','zh_CN','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1302,2,'Glpi\\Form\\Question','question_name','zh_CN','{\"one\":\"\\u5206\\u7c7b\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1303,3,'Glpi\\Form\\Question','question_name','zh_CN','{}','13fc108822413e5c9a9b177c353b8718'),
(1304,4,'Glpi\\Form\\Question','question_name','zh_CN','{\"one\":\"\\u89c2\\u5bdf\\u8005\"}','afee7117d982a452a8a772b513c58412'),
(1305,5,'Glpi\\Form\\Question','question_name','zh_CN','{\"one\":\"\\u5730\\u70b9\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1306,6,'Glpi\\Form\\Question','question_name','zh_CN','{}','09b79d379db0c82b4615d749b22475f0'),
(1307,6,'Glpi\\Form\\Question','question_default_value','zh_CN','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1308,7,'Glpi\\Form\\Question','question_name','zh_CN','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1309,8,'Glpi\\Form\\Question','question_name','zh_CN','{}','270774c2dc685cc979a7d7a2426bf193'),
(1310,2,'Glpi\\Form\\Form','form_name','zh_CN','{}','99d2310dc614498390a30da92a419eb2'),
(1311,2,'Glpi\\Form\\Form','form_description','zh_CN','{}','fb1026f69a37a5b62523c53c03402d91'),
(1312,9,'Glpi\\Form\\Question','question_name','zh_CN','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1313,10,'Glpi\\Form\\Question','question_name','zh_CN','{\"one\":\"\\u5206\\u7c7b\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1314,11,'Glpi\\Form\\Question','question_name','zh_CN','{}','13fc108822413e5c9a9b177c353b8718'),
(1315,12,'Glpi\\Form\\Question','question_name','zh_CN','{\"one\":\"\\u89c2\\u5bdf\\u8005\"}','afee7117d982a452a8a772b513c58412'),
(1316,13,'Glpi\\Form\\Question','question_name','zh_CN','{\"one\":\"\\u5730\\u70b9\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1317,14,'Glpi\\Form\\Question','question_name','zh_CN','{}','09b79d379db0c82b4615d749b22475f0'),
(1318,14,'Glpi\\Form\\Question','question_default_value','zh_CN','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1319,15,'Glpi\\Form\\Question','question_name','zh_CN','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1320,16,'Glpi\\Form\\Question','question_name','zh_CN','{}','270774c2dc685cc979a7d7a2426bf193'),
(1321,1,'Glpi\\Form\\Form','form_name','zh_TW','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(1322,1,'Glpi\\Form\\Form','form_description','zh_TW','{}','2794669861cc00408fef842e5cf6930a'),
(1323,1,'Glpi\\Form\\Question','question_name','zh_TW','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1324,2,'Glpi\\Form\\Question','question_name','zh_TW','{\"one\":\"\\u5206\\u985e\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1325,3,'Glpi\\Form\\Question','question_name','zh_TW','{}','13fc108822413e5c9a9b177c353b8718'),
(1326,4,'Glpi\\Form\\Question','question_name','zh_TW','{\"one\":\"\\u89c0\\u5bdf\\u54e1\"}','afee7117d982a452a8a772b513c58412'),
(1327,5,'Glpi\\Form\\Question','question_name','zh_TW','{\"one\":\"\\u4f4d\\u7f6e\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1328,6,'Glpi\\Form\\Question','question_name','zh_TW','{}','09b79d379db0c82b4615d749b22475f0'),
(1329,6,'Glpi\\Form\\Question','question_default_value','zh_TW','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1330,7,'Glpi\\Form\\Question','question_name','zh_TW','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1331,8,'Glpi\\Form\\Question','question_name','zh_TW','{}','270774c2dc685cc979a7d7a2426bf193'),
(1332,2,'Glpi\\Form\\Form','form_name','zh_TW','{}','99d2310dc614498390a30da92a419eb2'),
(1333,2,'Glpi\\Form\\Form','form_description','zh_TW','{}','fb1026f69a37a5b62523c53c03402d91'),
(1334,9,'Glpi\\Form\\Question','question_name','zh_TW','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1335,10,'Glpi\\Form\\Question','question_name','zh_TW','{\"one\":\"\\u5206\\u985e\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1336,11,'Glpi\\Form\\Question','question_name','zh_TW','{}','13fc108822413e5c9a9b177c353b8718'),
(1337,12,'Glpi\\Form\\Question','question_name','zh_TW','{\"one\":\"\\u89c0\\u5bdf\\u54e1\"}','afee7117d982a452a8a772b513c58412'),
(1338,13,'Glpi\\Form\\Question','question_name','zh_TW','{\"one\":\"\\u4f4d\\u7f6e\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1339,14,'Glpi\\Form\\Question','question_name','zh_TW','{}','09b79d379db0c82b4615d749b22475f0'),
(1340,14,'Glpi\\Form\\Question','question_default_value','zh_TW','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1341,15,'Glpi\\Form\\Question','question_name','zh_TW','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1342,16,'Glpi\\Form\\Question','question_name','zh_TW','{}','270774c2dc685cc979a7d7a2426bf193'),
(1343,1,'Glpi\\Form\\Form','form_name','ko_KR','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(1344,1,'Glpi\\Form\\Form','form_description','ko_KR','{}','2794669861cc00408fef842e5cf6930a'),
(1345,1,'Glpi\\Form\\Question','question_name','ko_KR','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1346,2,'Glpi\\Form\\Question','question_name','ko_KR','{\"one\":\"\\uce74\\ud14c\\uace0\\ub9ac\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1347,3,'Glpi\\Form\\Question','question_name','ko_KR','{}','13fc108822413e5c9a9b177c353b8718'),
(1348,4,'Glpi\\Form\\Question','question_name','ko_KR','{\"one\":\"\\ucc38\\uad00\\uc790\"}','afee7117d982a452a8a772b513c58412'),
(1349,5,'Glpi\\Form\\Question','question_name','ko_KR','{\"one\":\"\\uc704\\uce58\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1350,6,'Glpi\\Form\\Question','question_name','ko_KR','{}','09b79d379db0c82b4615d749b22475f0'),
(1351,6,'Glpi\\Form\\Question','question_default_value','ko_KR','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1352,7,'Glpi\\Form\\Question','question_name','ko_KR','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1353,8,'Glpi\\Form\\Question','question_name','ko_KR','{}','270774c2dc685cc979a7d7a2426bf193'),
(1354,2,'Glpi\\Form\\Form','form_name','ko_KR','{}','99d2310dc614498390a30da92a419eb2'),
(1355,2,'Glpi\\Form\\Form','form_description','ko_KR','{}','fb1026f69a37a5b62523c53c03402d91'),
(1356,9,'Glpi\\Form\\Question','question_name','ko_KR','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1357,10,'Glpi\\Form\\Question','question_name','ko_KR','{\"one\":\"\\uce74\\ud14c\\uace0\\ub9ac\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1358,11,'Glpi\\Form\\Question','question_name','ko_KR','{}','13fc108822413e5c9a9b177c353b8718'),
(1359,12,'Glpi\\Form\\Question','question_name','ko_KR','{\"one\":\"\\ucc38\\uad00\\uc790\"}','afee7117d982a452a8a772b513c58412'),
(1360,13,'Glpi\\Form\\Question','question_name','ko_KR','{\"one\":\"\\uc704\\uce58\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1361,14,'Glpi\\Form\\Question','question_name','ko_KR','{}','09b79d379db0c82b4615d749b22475f0'),
(1362,14,'Glpi\\Form\\Question','question_default_value','ko_KR','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1363,15,'Glpi\\Form\\Question','question_name','ko_KR','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1364,16,'Glpi\\Form\\Question','question_name','ko_KR','{}','270774c2dc685cc979a7d7a2426bf193'),
(1365,1,'Glpi\\Form\\Form','form_name','zh_HK','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(1366,1,'Glpi\\Form\\Form','form_description','zh_HK','{}','2794669861cc00408fef842e5cf6930a'),
(1367,1,'Glpi\\Form\\Question','question_name','zh_HK','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1368,2,'Glpi\\Form\\Question','question_name','zh_HK','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1369,3,'Glpi\\Form\\Question','question_name','zh_HK','{}','13fc108822413e5c9a9b177c353b8718'),
(1370,4,'Glpi\\Form\\Question','question_name','zh_HK','{\"one\":\"Observer\"}','afee7117d982a452a8a772b513c58412'),
(1371,5,'Glpi\\Form\\Question','question_name','zh_HK','{\"one\":\"Location\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1372,6,'Glpi\\Form\\Question','question_name','zh_HK','{}','09b79d379db0c82b4615d749b22475f0'),
(1373,6,'Glpi\\Form\\Question','question_default_value','zh_HK','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1374,7,'Glpi\\Form\\Question','question_name','zh_HK','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1375,8,'Glpi\\Form\\Question','question_name','zh_HK','{}','270774c2dc685cc979a7d7a2426bf193'),
(1376,2,'Glpi\\Form\\Form','form_name','zh_HK','{}','99d2310dc614498390a30da92a419eb2'),
(1377,2,'Glpi\\Form\\Form','form_description','zh_HK','{}','fb1026f69a37a5b62523c53c03402d91'),
(1378,9,'Glpi\\Form\\Question','question_name','zh_HK','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1379,10,'Glpi\\Form\\Question','question_name','zh_HK','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1380,11,'Glpi\\Form\\Question','question_name','zh_HK','{}','13fc108822413e5c9a9b177c353b8718'),
(1381,12,'Glpi\\Form\\Question','question_name','zh_HK','{\"one\":\"Observer\"}','afee7117d982a452a8a772b513c58412'),
(1382,13,'Glpi\\Form\\Question','question_name','zh_HK','{\"one\":\"Location\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1383,14,'Glpi\\Form\\Question','question_name','zh_HK','{}','09b79d379db0c82b4615d749b22475f0'),
(1384,14,'Glpi\\Form\\Question','question_default_value','zh_HK','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1385,15,'Glpi\\Form\\Question','question_name','zh_HK','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1386,16,'Glpi\\Form\\Question','question_name','zh_HK','{}','270774c2dc685cc979a7d7a2426bf193'),
(1387,1,'Glpi\\Form\\Form','form_name','be_BY','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(1388,1,'Glpi\\Form\\Form','form_description','be_BY','{}','2794669861cc00408fef842e5cf6930a'),
(1389,1,'Glpi\\Form\\Question','question_name','be_BY','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1390,2,'Glpi\\Form\\Question','question_name','be_BY','{\"one\":\"\\u041a\\u0430\\u0442\\u044d\\u0433\\u043e\\u0440\\u044b\\u044f\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1391,3,'Glpi\\Form\\Question','question_name','be_BY','{}','13fc108822413e5c9a9b177c353b8718'),
(1392,4,'Glpi\\Form\\Question','question_name','be_BY','{\"one\":\"\\u041d\\u0430\\u0437\\u0456\\u0440\\u0430\\u043b\\u044c\\u043d\\u0456\\u043a\\u0456\"}','afee7117d982a452a8a772b513c58412'),
(1393,5,'Glpi\\Form\\Question','question_name','be_BY','{\"one\":\"\\u041c\\u0435\\u0441\\u0446\\u0430\\u0437\\u043d\\u0430\\u0445\\u043e\\u0434\\u0436\\u0430\\u043d\\u043d\\u0435\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1394,6,'Glpi\\Form\\Question','question_name','be_BY','{}','09b79d379db0c82b4615d749b22475f0'),
(1395,6,'Glpi\\Form\\Question','question_default_value','be_BY','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1396,7,'Glpi\\Form\\Question','question_name','be_BY','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1397,8,'Glpi\\Form\\Question','question_name','be_BY','{}','270774c2dc685cc979a7d7a2426bf193'),
(1398,2,'Glpi\\Form\\Form','form_name','be_BY','{}','99d2310dc614498390a30da92a419eb2'),
(1399,2,'Glpi\\Form\\Form','form_description','be_BY','{}','fb1026f69a37a5b62523c53c03402d91'),
(1400,9,'Glpi\\Form\\Question','question_name','be_BY','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1401,10,'Glpi\\Form\\Question','question_name','be_BY','{\"one\":\"\\u041a\\u0430\\u0442\\u044d\\u0433\\u043e\\u0440\\u044b\\u044f\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1402,11,'Glpi\\Form\\Question','question_name','be_BY','{}','13fc108822413e5c9a9b177c353b8718'),
(1403,12,'Glpi\\Form\\Question','question_name','be_BY','{\"one\":\"\\u041d\\u0430\\u0437\\u0456\\u0440\\u0430\\u043b\\u044c\\u043d\\u0456\\u043a\\u0456\"}','afee7117d982a452a8a772b513c58412'),
(1404,13,'Glpi\\Form\\Question','question_name','be_BY','{\"one\":\"\\u041c\\u0435\\u0441\\u0446\\u0430\\u0437\\u043d\\u0430\\u0445\\u043e\\u0434\\u0436\\u0430\\u043d\\u043d\\u0435\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1405,14,'Glpi\\Form\\Question','question_name','be_BY','{}','09b79d379db0c82b4615d749b22475f0'),
(1406,14,'Glpi\\Form\\Question','question_default_value','be_BY','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1407,15,'Glpi\\Form\\Question','question_name','be_BY','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1408,16,'Glpi\\Form\\Question','question_name','be_BY','{}','270774c2dc685cc979a7d7a2426bf193'),
(1409,1,'Glpi\\Form\\Form','form_name','is_IS','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(1410,1,'Glpi\\Form\\Form','form_description','is_IS','{}','2794669861cc00408fef842e5cf6930a'),
(1411,1,'Glpi\\Form\\Question','question_name','is_IS','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1412,2,'Glpi\\Form\\Question','question_name','is_IS','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1413,3,'Glpi\\Form\\Question','question_name','is_IS','{}','13fc108822413e5c9a9b177c353b8718'),
(1414,4,'Glpi\\Form\\Question','question_name','is_IS','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(1415,5,'Glpi\\Form\\Question','question_name','is_IS','{\"one\":\"Sta\\u00f0setningar\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1416,6,'Glpi\\Form\\Question','question_name','is_IS','{}','09b79d379db0c82b4615d749b22475f0'),
(1417,6,'Glpi\\Form\\Question','question_default_value','is_IS','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1418,7,'Glpi\\Form\\Question','question_name','is_IS','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1419,8,'Glpi\\Form\\Question','question_name','is_IS','{}','270774c2dc685cc979a7d7a2426bf193'),
(1420,2,'Glpi\\Form\\Form','form_name','is_IS','{}','99d2310dc614498390a30da92a419eb2'),
(1421,2,'Glpi\\Form\\Form','form_description','is_IS','{}','fb1026f69a37a5b62523c53c03402d91'),
(1422,9,'Glpi\\Form\\Question','question_name','is_IS','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1423,10,'Glpi\\Form\\Question','question_name','is_IS','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1424,11,'Glpi\\Form\\Question','question_name','is_IS','{}','13fc108822413e5c9a9b177c353b8718'),
(1425,12,'Glpi\\Form\\Question','question_name','is_IS','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(1426,13,'Glpi\\Form\\Question','question_name','is_IS','{\"one\":\"Sta\\u00f0setningar\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1427,14,'Glpi\\Form\\Question','question_name','is_IS','{}','09b79d379db0c82b4615d749b22475f0'),
(1428,14,'Glpi\\Form\\Question','question_default_value','is_IS','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1429,15,'Glpi\\Form\\Question','question_name','is_IS','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1430,16,'Glpi\\Form\\Question','question_name','is_IS','{}','270774c2dc685cc979a7d7a2426bf193'),
(1431,1,'Glpi\\Form\\Form','form_name','eo','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(1432,1,'Glpi\\Form\\Form','form_description','eo','{}','2794669861cc00408fef842e5cf6930a'),
(1433,1,'Glpi\\Form\\Question','question_name','eo','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1434,2,'Glpi\\Form\\Question','question_name','eo','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1435,3,'Glpi\\Form\\Question','question_name','eo','{}','13fc108822413e5c9a9b177c353b8718'),
(1436,4,'Glpi\\Form\\Question','question_name','eo','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(1437,5,'Glpi\\Form\\Question','question_name','eo','{\"one\":\"Location\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1438,6,'Glpi\\Form\\Question','question_name','eo','{}','09b79d379db0c82b4615d749b22475f0'),
(1439,6,'Glpi\\Form\\Question','question_default_value','eo','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1440,7,'Glpi\\Form\\Question','question_name','eo','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1441,8,'Glpi\\Form\\Question','question_name','eo','{}','270774c2dc685cc979a7d7a2426bf193'),
(1442,2,'Glpi\\Form\\Form','form_name','eo','{}','99d2310dc614498390a30da92a419eb2'),
(1443,2,'Glpi\\Form\\Form','form_description','eo','{}','fb1026f69a37a5b62523c53c03402d91'),
(1444,9,'Glpi\\Form\\Question','question_name','eo','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1445,10,'Glpi\\Form\\Question','question_name','eo','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1446,11,'Glpi\\Form\\Question','question_name','eo','{}','13fc108822413e5c9a9b177c353b8718'),
(1447,12,'Glpi\\Form\\Question','question_name','eo','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(1448,13,'Glpi\\Form\\Question','question_name','eo','{\"one\":\"Location\"}','a22dd2e0bf995c59b63ef79cf2511035'),
(1449,14,'Glpi\\Form\\Question','question_name','eo','{}','09b79d379db0c82b4615d749b22475f0'),
(1450,14,'Glpi\\Form\\Question','question_default_value','eo','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1451,15,'Glpi\\Form\\Question','question_name','eo','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1452,16,'Glpi\\Form\\Question','question_name','eo','{}','270774c2dc685cc979a7d7a2426bf193'),
(1453,1,'Glpi\\Form\\Form','form_name','es_CL','{}','6e23dc61903d9b4c4e60e67eb02bdbf7'),
(1454,1,'Glpi\\Form\\Form','form_description','es_CL','{}','2794669861cc00408fef842e5cf6930a'),
(1455,1,'Glpi\\Form\\Question','question_name','es_CL','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1456,2,'Glpi\\Form\\Question','question_name','es_CL','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1457,3,'Glpi\\Form\\Question','question_name','es_CL','{}','13fc108822413e5c9a9b177c353b8718'),
(1458,4,'Glpi\\Form\\Question','question_name','es_CL','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(1459,5,'Glpi\\Form\\Question','question_name','es_CL','{}','a22dd2e0bf995c59b63ef79cf2511035'),
(1460,6,'Glpi\\Form\\Question','question_name','es_CL','{}','09b79d379db0c82b4615d749b22475f0'),
(1461,6,'Glpi\\Form\\Question','question_default_value','es_CL','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1462,7,'Glpi\\Form\\Question','question_name','es_CL','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1463,8,'Glpi\\Form\\Question','question_name','es_CL','{}','270774c2dc685cc979a7d7a2426bf193'),
(1464,2,'Glpi\\Form\\Form','form_name','es_CL','{}','99d2310dc614498390a30da92a419eb2'),
(1465,2,'Glpi\\Form\\Form','form_description','es_CL','{}','fb1026f69a37a5b62523c53c03402d91'),
(1466,9,'Glpi\\Form\\Question','question_name','es_CL','{}','3f09a57b61fa6c6a6879ad4dc6ba354c'),
(1467,10,'Glpi\\Form\\Question','question_name','es_CL','{\"one\":\"Category\"}','624c6b241d2d14bbd285596ffcf2a9e7'),
(1468,11,'Glpi\\Form\\Question','question_name','es_CL','{}','13fc108822413e5c9a9b177c353b8718'),
(1469,12,'Glpi\\Form\\Question','question_name','es_CL','{\"one\":\"Observers\"}','afee7117d982a452a8a772b513c58412'),
(1470,13,'Glpi\\Form\\Question','question_name','es_CL','{}','a22dd2e0bf995c59b63ef79cf2511035'),
(1471,14,'Glpi\\Form\\Question','question_name','es_CL','{}','09b79d379db0c82b4615d749b22475f0'),
(1472,14,'Glpi\\Form\\Question','question_default_value','es_CL','{}','d41d8cd98f00b204e9800998ecf8427e'),
(1473,15,'Glpi\\Form\\Question','question_name','es_CL','{}','ef918abfb53ea5bc4fde3764e4c199de'),
(1474,16,'Glpi\\Form\\Question','question_name','es_CL','{}','270774c2dc685cc979a7d7a2426bf193');
/*!40000 ALTER TABLE `glpi_itemtranslations_itemtranslations` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_itemvirtualmachines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_itemvirtualmachines` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(255) DEFAULT NULL,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `name` varchar(255) NOT NULL DEFAULT '',
  `virtualmachinestates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `virtualmachinesystems_id` int(10) unsigned NOT NULL DEFAULT 0,
  `virtualmachinetypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `uuid` varchar(255) NOT NULL DEFAULT '',
  `vcpu` int(11) NOT NULL DEFAULT 0,
  `ram` int(10) unsigned DEFAULT NULL,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `entities_id` (`entities_id`),
  KEY `name` (`name`),
  KEY `virtualmachinestates_id` (`virtualmachinestates_id`),
  KEY `virtualmachinesystems_id` (`virtualmachinesystems_id`),
  KEY `vcpu` (`vcpu`),
  KEY `ram` (`ram`),
  KEY `is_deleted` (`is_deleted`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `uuid` (`uuid`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `virtualmachinetypes_id` (`virtualmachinetypes_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_itemvirtualmachines` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_itemvirtualmachines` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_itilcategories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_itilcategories` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `itilcategories_id` int(10) unsigned NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `completename` text DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `level` int(11) NOT NULL DEFAULT 0,
  `knowbaseitemcategories_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `groups_id` int(10) unsigned NOT NULL DEFAULT 0,
  `code` varchar(255) DEFAULT NULL,
  `ancestors_cache` longtext DEFAULT NULL,
  `sons_cache` longtext DEFAULT NULL,
  `is_helpdeskvisible` tinyint(4) NOT NULL DEFAULT 1,
  `tickettemplates_id_incident` int(10) unsigned NOT NULL DEFAULT 0,
  `tickettemplates_id_demand` int(10) unsigned NOT NULL DEFAULT 0,
  `changetemplates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `problemtemplates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_incident` int(11) NOT NULL DEFAULT 1,
  `is_request` int(11) NOT NULL DEFAULT 1,
  `is_problem` int(11) NOT NULL DEFAULT 1,
  `is_change` tinyint(4) NOT NULL DEFAULT 1,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `knowbaseitemcategories_id` (`knowbaseitemcategories_id`),
  KEY `users_id` (`users_id`),
  KEY `groups_id` (`groups_id`),
  KEY `is_helpdeskvisible` (`is_helpdeskvisible`),
  KEY `itilcategories_id` (`itilcategories_id`),
  KEY `tickettemplates_id_incident` (`tickettemplates_id_incident`),
  KEY `tickettemplates_id_demand` (`tickettemplates_id_demand`),
  KEY `changetemplates_id` (`changetemplates_id`),
  KEY `problemtemplates_id` (`problemtemplates_id`),
  KEY `is_incident` (`is_incident`),
  KEY `is_request` (`is_request`),
  KEY `is_problem` (`is_problem`),
  KEY `is_change` (`is_change`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `level` (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_itilcategories` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_itilcategories` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_itilfollowups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_itilfollowups` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `itemtype` varchar(100) NOT NULL,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date` timestamp NULL DEFAULT NULL,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id_editor` int(10) unsigned NOT NULL DEFAULT 0,
  `content` longtext DEFAULT NULL,
  `is_private` tinyint(4) NOT NULL DEFAULT 0,
  `requesttypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `timeline_position` tinyint(4) NOT NULL DEFAULT 0,
  `sourceitems_id` int(10) unsigned NOT NULL DEFAULT 0,
  `sourceof_items_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `date` (`date`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `users_id` (`users_id`),
  KEY `users_id_editor` (`users_id_editor`),
  KEY `is_private` (`is_private`),
  KEY `requesttypes_id` (`requesttypes_id`),
  KEY `sourceitems_id` (`sourceitems_id`),
  KEY `sourceof_items_id` (`sourceof_items_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_itilfollowups` DISABLE KEYS */;
INSERT INTO `glpi_itilfollowups` VALUES
(1,'Ticket',1,'2026-10-13 17:13:14',7,7,'Reviso el equipo en remoto; parece fallo de placa base.',0,0,'2026-10-13 17:13:14','2026-10-13 17:13:14',1,0,0),
(2,'Ticket',1,'2026-10-13 17:13:14',9,9,'Gracias, quedo a la espera de la reparacion.',0,0,'2026-10-13 17:13:14','2026-10-13 17:13:14',1,0,0),
(3,'Ticket',2,'2026-10-13 17:13:14',7,7,'Reviso los logs del servidor de aplicaciones.',0,0,'2026-10-13 17:13:14','2026-10-13 17:13:14',1,0,0);
/*!40000 ALTER TABLE `glpi_itilfollowups` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_itilfollowuptemplates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_itilfollowuptemplates` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `date_creation` timestamp NULL DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `content` mediumtext DEFAULT NULL,
  `requesttypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_private` tinyint(4) NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `pendingreasons_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `is_recursive` (`is_recursive`),
  KEY `requesttypes_id` (`requesttypes_id`),
  KEY `entities_id` (`entities_id`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `is_private` (`is_private`),
  KEY `pendingreasons_id` (`pendingreasons_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_itilfollowuptemplates` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_itilfollowuptemplates` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_itilreminders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_itilreminders` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `itemtype` varchar(100) NOT NULL,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `pendingreasons_id` int(10) unsigned NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `content` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `pendingreasons_id` (`pendingreasons_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_itilreminders` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_itilreminders` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_itils_projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_itils_projects` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `itemtype` varchar(100) NOT NULL DEFAULT '',
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `projects_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`itemtype`,`items_id`,`projects_id`),
  KEY `projects_id` (`projects_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_itils_projects` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_itils_projects` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_itils_validationsteps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_itils_validationsteps` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `minimal_required_validation_percent` tinyint(3) unsigned NOT NULL,
  `validationsteps_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(255) NOT NULL,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`itemtype`,`items_id`,`validationsteps_id`),
  KEY `validationsteps_id` (`validationsteps_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_itils_validationsteps` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_itils_validationsteps` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_itilsolutions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_itilsolutions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `itemtype` varchar(100) NOT NULL,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `solutiontypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `solutiontype_name` varchar(255) DEFAULT NULL,
  `content` longtext DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_approval` timestamp NULL DEFAULT NULL,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `user_name` varchar(255) DEFAULT NULL,
  `users_id_editor` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id_approval` int(10) unsigned NOT NULL DEFAULT 0,
  `user_name_approval` varchar(255) DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 1,
  `itilfollowups_id` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `solutiontypes_id` (`solutiontypes_id`),
  KEY `users_id` (`users_id`),
  KEY `users_id_editor` (`users_id_editor`),
  KEY `users_id_approval` (`users_id_approval`),
  KEY `status` (`status`),
  KEY `itilfollowups_id` (`itilfollowups_id`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_itilsolutions` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_itilsolutions` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_itilvalidationtemplates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_itilvalidationtemplates` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `validationsteps_id` int(10) unsigned NOT NULL DEFAULT 0,
  `name` varchar(255) NOT NULL DEFAULT '',
  `content` text DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `name` (`name`),
  KEY `validationsteps_id` (`validationsteps_id`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_itilvalidationtemplates` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_itilvalidationtemplates` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_itilvalidationtemplates_targets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_itilvalidationtemplates_targets` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `itilvalidationtemplates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(100) DEFAULT NULL,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `groups_id` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `itilvalidationtemplates_id` (`itilvalidationtemplates_id`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `groups_id` (`groups_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_itilvalidationtemplates_targets` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_itilvalidationtemplates_targets` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_knowbaseitemcategories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_knowbaseitemcategories` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `knowbaseitemcategories_id` int(10) unsigned NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `completename` text DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `level` int(11) NOT NULL DEFAULT 0,
  `sons_cache` longtext DEFAULT NULL,
  `ancestors_cache` longtext DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`entities_id`,`knowbaseitemcategories_id`,`name`),
  KEY `name` (`name`),
  KEY `is_recursive` (`is_recursive`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `knowbaseitemcategories_id` (`knowbaseitemcategories_id`),
  KEY `level` (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_knowbaseitemcategories` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_knowbaseitemcategories` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_knowbaseitems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_knowbaseitems` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `forms_categories_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `name` text DEFAULT NULL,
  `answer` longtext DEFAULT NULL,
  `is_faq` tinyint(4) NOT NULL DEFAULT 0,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `view` int(11) NOT NULL DEFAULT 0,
  `show_in_service_catalog` tinyint(4) NOT NULL DEFAULT 0,
  `description` longtext DEFAULT NULL,
  `illustration` varchar(255) DEFAULT NULL,
  `is_pinned` tinyint(4) NOT NULL DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `begin_date` timestamp NULL DEFAULT NULL,
  `end_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `entities_id` (`entities_id`),
  KEY `forms_categories_id` (`forms_categories_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `users_id` (`users_id`),
  KEY `is_faq` (`is_faq`),
  KEY `date_creation` (`date_creation`),
  KEY `date_mod` (`date_mod`),
  KEY `begin_date` (`begin_date`),
  KEY `end_date` (`end_date`),
  FULLTEXT KEY `fulltext` (`name`,`answer`),
  FULLTEXT KEY `name` (`name`),
  FULLTEXT KEY `answer` (`answer`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_knowbaseitems` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_knowbaseitems` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_knowbaseitems_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_knowbaseitems_comments` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `knowbaseitems_id` int(10) unsigned NOT NULL,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `language` varchar(10) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `parent_comment_id` int(10) unsigned DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `knowbaseitems_id` (`knowbaseitems_id`),
  KEY `parent_comment_id` (`parent_comment_id`),
  KEY `users_id` (`users_id`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_knowbaseitems_comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_knowbaseitems_comments` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_knowbaseitems_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_knowbaseitems_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `knowbaseitems_id` int(10) unsigned NOT NULL,
  `itemtype` varchar(100) NOT NULL,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`itemtype`,`items_id`,`knowbaseitems_id`),
  KEY `knowbaseitems_id` (`knowbaseitems_id`),
  KEY `date_creation` (`date_creation`),
  KEY `date_mod` (`date_mod`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_knowbaseitems_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_knowbaseitems_items` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_knowbaseitems_knowbaseitemcategories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_knowbaseitems_knowbaseitemcategories` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `knowbaseitems_id` int(10) unsigned NOT NULL DEFAULT 0,
  `knowbaseitemcategories_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `knowbaseitems_id` (`knowbaseitems_id`),
  KEY `knowbaseitemcategories_id` (`knowbaseitemcategories_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_knowbaseitems_knowbaseitemcategories` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_knowbaseitems_knowbaseitemcategories` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_knowbaseitems_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_knowbaseitems_profiles` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `knowbaseitems_id` int(10) unsigned NOT NULL DEFAULT 0,
  `profiles_id` int(10) unsigned NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned DEFAULT NULL,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `no_entity_restriction` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `knowbaseitems_id` (`knowbaseitems_id`),
  KEY `profiles_id` (`profiles_id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_knowbaseitems_profiles` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_knowbaseitems_profiles` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_knowbaseitems_revisions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_knowbaseitems_revisions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `knowbaseitems_id` int(10) unsigned NOT NULL,
  `revision` int(11) NOT NULL,
  `name` text DEFAULT NULL,
  `answer` longtext DEFAULT NULL,
  `language` varchar(10) DEFAULT NULL,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`knowbaseitems_id`,`revision`,`language`),
  KEY `revision` (`revision`),
  KEY `users_id` (`users_id`),
  KEY `date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_knowbaseitems_revisions` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_knowbaseitems_revisions` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_knowbaseitems_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_knowbaseitems_users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `knowbaseitems_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `knowbaseitems_id` (`knowbaseitems_id`),
  KEY `users_id` (`users_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_knowbaseitems_users` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_knowbaseitems_users` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_knowbaseitemtranslations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_knowbaseitemtranslations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `knowbaseitems_id` int(10) unsigned NOT NULL DEFAULT 0,
  `language` varchar(10) DEFAULT NULL,
  `name` text DEFAULT NULL,
  `answer` longtext DEFAULT NULL,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `item` (`knowbaseitems_id`,`language`),
  KEY `users_id` (`users_id`),
  KEY `date_creation` (`date_creation`),
  KEY `date_mod` (`date_mod`),
  FULLTEXT KEY `fulltext` (`name`,`answer`),
  FULLTEXT KEY `name` (`name`),
  FULLTEXT KEY `answer` (`answer`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_knowbaseitemtranslations` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_knowbaseitemtranslations` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_lineoperators`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_lineoperators` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL DEFAULT '',
  `comment` text DEFAULT NULL,
  `mcc` int(11) DEFAULT NULL,
  `mnc` int(11) DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`mcc`,`mnc`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_lineoperators` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_lineoperators` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_lines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_lines` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL DEFAULT '',
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `caller_num` varchar(255) NOT NULL DEFAULT '',
  `caller_name` varchar(255) NOT NULL DEFAULT '',
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id_tech` int(10) unsigned NOT NULL DEFAULT 0,
  `lineoperators_id` int(10) unsigned NOT NULL DEFAULT 0,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `states_id` int(10) unsigned NOT NULL DEFAULT 0,
  `linetypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `comment` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `is_deleted` (`is_deleted`),
  KEY `users_id` (`users_id`),
  KEY `users_id_tech` (`users_id_tech`),
  KEY `lineoperators_id` (`lineoperators_id`),
  KEY `linetypes_id` (`linetypes_id`),
  KEY `locations_id` (`locations_id`),
  KEY `states_id` (`states_id`),
  KEY `date_creation` (`date_creation`),
  KEY `date_mod` (`date_mod`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_lines` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_lines` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_linetypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_linetypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_linetypes` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_linetypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_links`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_links` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 1,
  `name` varchar(255) DEFAULT NULL,
  `link` varchar(255) DEFAULT NULL,
  `data` text DEFAULT NULL,
  `open_window` tinyint(4) NOT NULL DEFAULT 1,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_links` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_links` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_links_itemtypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_links_itemtypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `links_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`itemtype`,`links_id`),
  KEY `links_id` (`links_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_links_itemtypes` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_links_itemtypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_locations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `code` varchar(255) DEFAULT NULL,
  `alias` varchar(255) DEFAULT NULL,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `completename` text DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `level` int(11) NOT NULL DEFAULT 0,
  `ancestors_cache` longtext DEFAULT NULL,
  `sons_cache` longtext DEFAULT NULL,
  `address` text DEFAULT NULL,
  `postcode` varchar(255) DEFAULT NULL,
  `town` varchar(255) DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `building` varchar(255) DEFAULT NULL,
  `room` varchar(255) DEFAULT NULL,
  `latitude` varchar(255) DEFAULT NULL,
  `longitude` varchar(255) DEFAULT NULL,
  `altitude` varchar(255) DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`entities_id`,`locations_id`,`name`),
  KEY `locations_id` (`locations_id`),
  KEY `name` (`name`),
  KEY `is_recursive` (`is_recursive`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `level` (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_locations` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_locations` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_lockedfields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_lockedfields` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `itemtype` varchar(100) DEFAULT NULL,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `field` varchar(50) NOT NULL,
  `value` varchar(255) DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `is_global` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`itemtype`,`items_id`,`field`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `is_global` (`is_global`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_lockedfields` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_lockedfields` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_mailcollectors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_mailcollectors` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `host` varchar(255) DEFAULT NULL,
  `login` varchar(255) DEFAULT NULL,
  `filesize_max` int(11) NOT NULL DEFAULT 2097152,
  `is_active` tinyint(4) NOT NULL DEFAULT 1,
  `date_mod` timestamp NULL DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `passwd` varchar(255) DEFAULT NULL,
  `accepted` varchar(255) DEFAULT NULL,
  `refused` varchar(255) DEFAULT NULL,
  `errors` int(11) NOT NULL DEFAULT 0,
  `use_mail_date` tinyint(4) NOT NULL DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT NULL,
  `requester_field` int(11) NOT NULL DEFAULT 0,
  `add_to_to_observer` tinyint(4) NOT NULL DEFAULT 1,
  `add_cc_to_observer` tinyint(4) NOT NULL DEFAULT 0,
  `collect_only_unread` tinyint(4) NOT NULL DEFAULT 0,
  `create_user_from_email` tinyint(4) NOT NULL DEFAULT 0,
  `last_collect_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `is_active` (`is_active`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `last_collect_date` (`last_collect_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_mailcollectors` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_mailcollectors` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_manuallinks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_manuallinks` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `url` varchar(8096) NOT NULL,
  `open_window` tinyint(4) NOT NULL DEFAULT 1,
  `icon` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(255) DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `items_id` (`items_id`),
  KEY `date_creation` (`date_creation`),
  KEY `date_mod` (`date_mod`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_manuallinks` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_manuallinks` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_manufacturers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_manufacturers` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_manufacturers` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_manufacturers` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_monitormodels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_monitormodels` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `product_number` varchar(255) DEFAULT NULL,
  `weight` int(11) NOT NULL DEFAULT 0,
  `required_units` int(11) NOT NULL DEFAULT 1,
  `depth` float NOT NULL DEFAULT 1,
  `power_connections` int(11) NOT NULL DEFAULT 0,
  `power_consumption` int(11) NOT NULL DEFAULT 0,
  `is_half_rack` tinyint(4) NOT NULL DEFAULT 0,
  `picture_front` text DEFAULT NULL,
  `picture_rear` text DEFAULT NULL,
  `pictures` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `product_number` (`product_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_monitormodels` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_monitormodels` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_monitors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_monitors` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `contact` varchar(255) DEFAULT NULL,
  `contact_num` varchar(255) DEFAULT NULL,
  `users_id_tech` int(10) unsigned NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `serial` varchar(255) DEFAULT NULL,
  `otherserial` varchar(255) DEFAULT NULL,
  `size` decimal(5,2) NOT NULL DEFAULT 0.00,
  `have_micro` tinyint(4) NOT NULL DEFAULT 0,
  `have_speaker` tinyint(4) NOT NULL DEFAULT 0,
  `have_subd` tinyint(4) NOT NULL DEFAULT 0,
  `have_bnc` tinyint(4) NOT NULL DEFAULT 0,
  `have_dvi` tinyint(4) NOT NULL DEFAULT 0,
  `have_pivot` tinyint(4) NOT NULL DEFAULT 0,
  `have_hdmi` tinyint(4) NOT NULL DEFAULT 0,
  `have_displayport` tinyint(4) NOT NULL DEFAULT 0,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `monitortypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `monitormodels_id` int(10) unsigned NOT NULL DEFAULT 0,
  `manufacturers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_global` tinyint(4) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_template` tinyint(4) NOT NULL DEFAULT 0,
  `template_name` varchar(255) DEFAULT NULL,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `states_id` int(10) unsigned NOT NULL DEFAULT 0,
  `ticket_tco` decimal(20,4) DEFAULT 0.0000,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `autoupdatesystems_id` int(10) unsigned NOT NULL DEFAULT 0,
  `uuid` varchar(255) DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `is_template` (`is_template`),
  KEY `is_global` (`is_global`),
  KEY `entities_id` (`entities_id`),
  KEY `manufacturers_id` (`manufacturers_id`),
  KEY `users_id` (`users_id`),
  KEY `locations_id` (`locations_id`),
  KEY `monitormodels_id` (`monitormodels_id`),
  KEY `states_id` (`states_id`),
  KEY `users_id_tech` (`users_id_tech`),
  KEY `monitortypes_id` (`monitortypes_id`),
  KEY `active_assets` (`is_deleted`,`is_template`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `autoupdatesystems_id` (`autoupdatesystems_id`),
  KEY `serial` (`serial`),
  KEY `otherserial` (`otherserial`),
  KEY `uuid` (`uuid`),
  KEY `date_creation` (`date_creation`),
  KEY `is_recursive` (`is_recursive`),
  KEY `date_mod` (`date_mod`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_monitors` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_monitors` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_monitortypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_monitortypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_monitortypes` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_monitortypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_networkaliases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_networkaliases` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `networknames_id` int(10) unsigned NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `fqdns_id` int(10) unsigned NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `entities_id` (`entities_id`),
  KEY `name` (`name`),
  KEY `networknames_id` (`networknames_id`),
  KEY `fqdns_id` (`fqdns_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_networkaliases` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_networkaliases` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_networkequipmentmodels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_networkequipmentmodels` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `product_number` varchar(255) DEFAULT NULL,
  `weight` int(11) NOT NULL DEFAULT 0,
  `required_units` int(11) NOT NULL DEFAULT 1,
  `depth` float NOT NULL DEFAULT 1,
  `power_connections` int(11) NOT NULL DEFAULT 0,
  `power_consumption` int(11) NOT NULL DEFAULT 0,
  `is_half_rack` tinyint(4) NOT NULL DEFAULT 0,
  `picture_front` text DEFAULT NULL,
  `picture_rear` text DEFAULT NULL,
  `pictures` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `product_number` (`product_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_networkequipmentmodels` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_networkequipmentmodels` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_networkequipments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_networkequipments` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `ram` int(10) unsigned DEFAULT NULL,
  `serial` varchar(255) DEFAULT NULL,
  `otherserial` varchar(255) DEFAULT NULL,
  `contact` varchar(255) DEFAULT NULL,
  `contact_num` varchar(255) DEFAULT NULL,
  `users_id_tech` int(10) unsigned NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `networks_id` int(10) unsigned NOT NULL DEFAULT 0,
  `networkequipmenttypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `networkequipmentmodels_id` int(10) unsigned NOT NULL DEFAULT 0,
  `manufacturers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_template` tinyint(4) NOT NULL DEFAULT 0,
  `template_name` varchar(255) DEFAULT NULL,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `states_id` int(10) unsigned NOT NULL DEFAULT 0,
  `ticket_tco` decimal(20,4) DEFAULT 0.0000,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `uuid` varchar(255) DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `autoupdatesystems_id` int(10) unsigned NOT NULL DEFAULT 0,
  `sysdescr` text DEFAULT NULL,
  `cpu` int(11) NOT NULL DEFAULT 0,
  `uptime` varchar(255) NOT NULL DEFAULT '0',
  `last_inventory_update` timestamp NULL DEFAULT NULL,
  `snmpcredentials_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `is_template` (`is_template`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `manufacturers_id` (`manufacturers_id`),
  KEY `users_id` (`users_id`),
  KEY `locations_id` (`locations_id`),
  KEY `networkequipmentmodels_id` (`networkequipmentmodels_id`),
  KEY `networks_id` (`networks_id`),
  KEY `states_id` (`states_id`),
  KEY `users_id_tech` (`users_id_tech`),
  KEY `networkequipmenttypes_id` (`networkequipmenttypes_id`),
  KEY `active_assets` (`is_deleted`,`is_template`),
  KEY `date_mod` (`date_mod`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `serial` (`serial`),
  KEY `otherserial` (`otherserial`),
  KEY `uuid` (`uuid`),
  KEY `date_creation` (`date_creation`),
  KEY `autoupdatesystems_id` (`autoupdatesystems_id`),
  KEY `snmpcredentials_id` (`snmpcredentials_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_networkequipments` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_networkequipments` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_networkequipmenttypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_networkequipmenttypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_networkequipmenttypes` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_networkequipmenttypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_networkinterfaces`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_networkinterfaces` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_networkinterfaces` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_networkinterfaces` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_networknames`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_networknames` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(100) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `fqdns_id` int(10) unsigned NOT NULL DEFAULT 0,
  `ipnetworks_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `entities_id` (`entities_id`),
  KEY `FQDN` (`name`,`fqdns_id`),
  KEY `fqdns_id` (`fqdns_id`),
  KEY `is_deleted` (`is_deleted`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `item` (`itemtype`,`items_id`,`is_deleted`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `ipnetworks_id` (`ipnetworks_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_networknames` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_networknames` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_networkportaggregates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_networkportaggregates` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `networkports_id` int(10) unsigned NOT NULL DEFAULT 0,
  `networkports_id_list` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `networkports_id` (`networkports_id`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_networkportaggregates` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_networkportaggregates` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_networkportaliases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_networkportaliases` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `networkports_id` int(10) unsigned NOT NULL DEFAULT 0,
  `networkports_id_alias` int(10) unsigned NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `networkports_id` (`networkports_id`),
  KEY `networkports_id_alias` (`networkports_id_alias`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_networkportaliases` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_networkportaliases` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_networkportconnectionlogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_networkportconnectionlogs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `date` timestamp NULL DEFAULT NULL,
  `connected` tinyint(4) NOT NULL DEFAULT 0,
  `networkports_id_source` int(10) unsigned NOT NULL DEFAULT 0,
  `networkports_id_destination` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `date` (`date`),
  KEY `networkports_id_source` (`networkports_id_source`),
  KEY `networkports_id_destination` (`networkports_id_destination`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_networkportconnectionlogs` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_networkportconnectionlogs` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_networkportdialups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_networkportdialups` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `networkports_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `networkports_id` (`networkports_id`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_networkportdialups` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_networkportdialups` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_networkportethernets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_networkportethernets` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `networkports_id` int(10) unsigned NOT NULL DEFAULT 0,
  `items_devicenetworkcards_id` int(10) unsigned NOT NULL DEFAULT 0,
  `type` varchar(10) DEFAULT '',
  `speed` int(11) NOT NULL DEFAULT 10,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `networkports_id` (`networkports_id`),
  KEY `card` (`items_devicenetworkcards_id`),
  KEY `type` (`type`),
  KEY `speed` (`speed`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_networkportethernets` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_networkportethernets` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_networkportfiberchannels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_networkportfiberchannels` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `networkports_id` int(10) unsigned NOT NULL DEFAULT 0,
  `items_devicenetworkcards_id` int(10) unsigned NOT NULL DEFAULT 0,
  `networkportfiberchanneltypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `wwn` varchar(50) DEFAULT '',
  `speed` int(11) NOT NULL DEFAULT 10,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `networkports_id` (`networkports_id`),
  KEY `card` (`items_devicenetworkcards_id`),
  KEY `type` (`networkportfiberchanneltypes_id`),
  KEY `wwn` (`wwn`),
  KEY `speed` (`speed`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_networkportfiberchannels` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_networkportfiberchannels` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_networkportfiberchanneltypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_networkportfiberchanneltypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_networkportfiberchanneltypes` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_networkportfiberchanneltypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_networkportlocals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_networkportlocals` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `networkports_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `networkports_id` (`networkports_id`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_networkportlocals` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_networkportlocals` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_networkportmetrics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_networkportmetrics` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `date` date DEFAULT NULL,
  `ifinbytes` bigint(20) NOT NULL DEFAULT 0,
  `ifinerrors` bigint(20) NOT NULL DEFAULT 0,
  `ifoutbytes` bigint(20) NOT NULL DEFAULT 0,
  `ifouterrors` bigint(20) NOT NULL DEFAULT 0,
  `networkports_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`networkports_id`,`date`),
  KEY `date` (`date`),
  KEY `date_creation` (`date_creation`),
  KEY `date_mod` (`date_mod`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_networkportmetrics` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_networkportmetrics` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_networkports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_networkports` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(100) NOT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `logical_number` int(11) NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `instantiation_type` varchar(255) DEFAULT NULL,
  `mac` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `ifmtu` int(11) NOT NULL DEFAULT 0,
  `ifspeed` bigint(20) NOT NULL DEFAULT 0,
  `ifinternalstatus` varchar(255) DEFAULT NULL,
  `ifconnectionstatus` int(11) NOT NULL DEFAULT 0,
  `iflastchange` varchar(255) DEFAULT NULL,
  `ifinbytes` bigint(20) NOT NULL DEFAULT 0,
  `ifinerrors` bigint(20) NOT NULL DEFAULT 0,
  `ifoutbytes` bigint(20) NOT NULL DEFAULT 0,
  `ifouterrors` bigint(20) NOT NULL DEFAULT 0,
  `ifstatus` varchar(255) DEFAULT NULL,
  `ifdescr` varchar(255) DEFAULT NULL,
  `ifalias` varchar(255) DEFAULT NULL,
  `portduplex` varchar(255) DEFAULT NULL,
  `trunk` tinyint(4) NOT NULL DEFAULT 0,
  `lastup` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `mac` (`mac`),
  KEY `is_deleted` (`is_deleted`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_networkports` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_networkports` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_networkports_networkports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_networkports_networkports` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `networkports_id_1` int(10) unsigned NOT NULL DEFAULT 0,
  `networkports_id_2` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`networkports_id_1`,`networkports_id_2`),
  KEY `networkports_id_2` (`networkports_id_2`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_networkports_networkports` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_networkports_networkports` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_networkports_vlans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_networkports_vlans` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `networkports_id` int(10) unsigned NOT NULL DEFAULT 0,
  `vlans_id` int(10) unsigned NOT NULL DEFAULT 0,
  `tagged` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`networkports_id`,`vlans_id`),
  KEY `vlans_id` (`vlans_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_networkports_vlans` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_networkports_vlans` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_networkporttypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_networkporttypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `value_decimal` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `is_importable` tinyint(4) NOT NULL DEFAULT 0,
  `instantiation_type` varchar(255) DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `value_decimal` (`value_decimal`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `is_importable` (`is_importable`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB AUTO_INCREMENT=304 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_networkporttypes` DISABLE KEYS */;
INSERT INTO `glpi_networkporttypes` VALUES
(1,0,0,1,'other','none of the following [RFC1213]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(2,0,0,2,'regular1822','BBN Report 1822 [RFC1213]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(3,0,0,3,'hdh1822','BBN Report 1822 [RFC1213]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(4,0,0,4,'ddn-x25','BBN Report 1822 [RFC1213]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(5,0,0,5,'x25','X.25 [RFC1382]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(6,0,0,6,'ethernet-csmacd','[RFC1213]',1,'NetworkPortEthernet','2026-10-13 17:00:52','2026-10-13 17:00:52'),
(7,0,0,7,'IEEE802.3','DEPRECATED [RFC3635]',1,'NetworkPortEthernet','2026-10-13 17:00:52','2026-10-13 17:00:52'),
(8,0,0,8,'IEEE802.4','Token Bus-like Objects [RFC1239]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(9,0,0,9,'IEEE802.5','Token Ring-like Objects [RFC1748]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(10,0,0,10,'iso88026-man','[RFC1213]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(11,0,0,11,'starLan','DEPRECATED [RFC3635]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(12,0,0,12,'proteon-10Mbit','[RFC1213]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(13,0,0,13,'proteon-80Mbit','[RFC1213]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(14,0,0,14,'hyperchannel','[RFC1213]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(15,0,0,15,'FDDI','FDDI Objects [RFC1512]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(16,0,0,16,'lapb','LAP B [RFC1381]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(17,0,0,17,'sdlc','[RFC1213]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(18,0,0,18,'ds1','T1/E1 Carrier Objects [RFC4805]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(19,0,0,19,'e1','obsolete [RFC4805]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(20,0,0,20,'basicISDN','[RFC1213]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(21,0,0,21,'primaryISDN','[RFC1213]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(22,0,0,22,'propPointToPointSerial','[RFC1213]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(23,0,0,23,'ppp','Point-to-Point Protocol [RFC1213][RFC1471]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(24,0,0,24,'softwareLoopback','[RFC1213]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(25,0,0,25,'eon','[RFC1213]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(26,0,0,26,'ethernet-3Mbit','[RFC1213]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(27,0,0,27,'nsip','[RFC1213]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(28,0,0,28,'slip','[RFC1213]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(29,0,0,29,'ultra','[RFC1213]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(30,0,0,30,'ds3','DS3/E3 Interface Objects [RFC3896]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(31,0,0,31,'sip','SMDS Interface Objects [RFC1694]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(32,0,0,32,'frame-relay','Frame Relay Objects for DTE [RFC2115]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(33,0,0,33,'RS-232','RS-232 Objects [RFC1659]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(34,0,0,34,'Parallel','Parallel Printer Objects [RFC1660]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(35,0,0,35,'arcnet','ARC network',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(36,0,0,36,'arcnet-plus','ARC network plus',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(37,0,0,37,'atm','ATM',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(38,0,0,38,'MIOX25','MIOX25 [RFC1461]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(39,0,0,39,'SONET','SONET or SDH',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(40,0,0,40,'x25ple','X.25 packet level [RFC2127]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(41,0,0,41,'iso88022llc','802.2 LLC',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(42,0,0,42,'localTalk','',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(43,0,0,43,'smds-dxi','SMDS DXI',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(44,0,0,44,'frameRelayService','Frame Relay DCE [RFC2954]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(45,0,0,45,'v35','V.35',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(46,0,0,46,'hssi','HSSI',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(47,0,0,47,'hippi','HIPPI',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(48,0,0,48,'modem','generic modem',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(49,0,0,49,'aal5','AAL5 over ATM',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(50,0,0,50,'sonetPath','',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(51,0,0,51,'sonetVT','',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(52,0,0,52,'smds-icip','SMDS Inter-Carrier Interface Protocol',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(53,0,0,53,'propVirtual','proprietary vitural/internal interface [RFC2863]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(54,0,0,54,'propMultiLink','proprietary multi-link multiplexing [RFC2863]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(55,0,0,55,'ieee80212','100BaseVG',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(56,0,0,56,'fibre-channel','Fibre Channel',1,'NetworkPortFiberchannel','2026-10-13 17:00:52','2026-10-13 17:00:52'),
(57,0,0,57,'hippiInterfaces','HIPPI interfaces [Philip_Cameron]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(58,0,0,58,'FrameRelayInterconnect','Interconnet over FR [Unknown]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(59,0,0,59,'aflane8023','ATM Emulated LAN for 802.3 [Keith_McCloghrie]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(60,0,0,60,'aflane8025','ATM Emulated LAN for 802.5 [Keith_McCloghrie]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(61,0,0,61,'cctEmul','ATM Emulated circuit [Guy_Fedorkow]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(62,0,0,62,'fastEther','DEPRECATED [RFC3635]',1,'NetworkPortEthernet','2026-10-13 17:00:52','2026-10-13 17:00:52'),
(63,0,0,63,'isdn','ISDN and X.25 [RFC1356]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(64,0,0,64,'v11','CCITT V.11/X.21 [Satish_Popat]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(65,0,0,65,'v36','CCITT V.36 [Satish_Popat]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(66,0,0,66,'g703-64k','CCITT G703 at 64Kbps [Satish_Popat]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(67,0,0,67,'g703-2mb','CCITT G703 at 2Mbps [Satish_Popat]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(68,0,0,68,'qllc','SNA QLLC [Satish_Popat]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(69,0,0,69,'fastEtherFX','DEPRECATED [RFC3635]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(70,0,0,70,'channel','channel [Steven_Schwell]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(71,0,0,71,'IEEE802.11','radio spread spectrum [Dawkoon_Paul_Lee]',1,'NetworkPortWifi','2026-10-13 17:00:52','2026-10-13 17:00:52'),
(72,0,0,72,'ibm370parChan','IBM System 360/370 OEMI Channel [Bill_Kwan]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(73,0,0,73,'ESCON','IBM Enterprise Systems Connection [Bill_Kwan]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(74,0,0,74,'DLSw','Data Link Switching [Bill_Kwan]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(75,0,0,75,'ISDNs','ISDN S/T interface [Ed_Alcoff]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(76,0,0,76,'ISDNu','ISDN U interface [Ed_Alcoff]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(77,0,0,77,'lapd','Link Access Protocol D [Ed_Alcoff]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(78,0,0,78,'ip-switch','IP Switching Objects [Joe_Wei]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(79,0,0,79,'rsrb','Remote Source Route Bridging [Bob_Clouston]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(80,0,0,80,'atm-logical','ATM Logical Port [RFC3606]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(81,0,0,81,'ds0','Digital Signal Level 0 [RFC2494]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(82,0,0,82,'ds0Bundle','group of ds0s on the same ds1 [RFC2494]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(83,0,0,83,'bsc','Bisynchronous Protocol [Bill_Kwan]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(84,0,0,84,'async','Asynchronous Protocol [Bill_Kwan]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(85,0,0,85,'cnr','Combat Net Radio [Herb_Jensen]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(86,0,0,86,'iso88025Dtr','ISO 802.5r DTR [Trevor_Warwick]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(87,0,0,87,'eplrs','Enhanced  Pos Loc Report Sys [Herb_Jensen]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(88,0,0,88,'arap','Appletalk Remote Access Protocol [Jim_Halpin]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(89,0,0,89,'propCnls','Proprietary Connectionless Proto. [Robert_Neill]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(90,0,0,90,'hostPad','CCITT-ITU X.29 PAD Protocol [Robert_Neill]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(91,0,0,91,'termPad','CCITT-ITU X.3 PAD Facility [Robert_Neill]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(92,0,0,92,'frameRelayMPI','Multiproto Interconnect over FR [Robert_Neill]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(93,0,0,93,'x213','CCITT-ITU X213 [Robert_Neill]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(94,0,0,94,'adsl','Asymmetric Digital Subscriber Loop [Gregory_Bathrick]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(95,0,0,95,'radsl','Rate-Adapt. Digital Subscriber Loop [Gregory_Bathrick]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(96,0,0,96,'sdsl','Symmetric Digital Subscriber Loop [Gregory_Bathrick]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(97,0,0,97,'vdsl','Very H-Speed Digital Subscrib. Loop [Gregory_Bathrick]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(98,0,0,98,'iso88025CRFPInt','ISO 802.5 CRFP [Trevor_Warwick]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(99,0,0,99,'myrinet','Myricom Myrinet [Bob_Felderman]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(100,0,0,100,'voiceEM','Voice recEive and transMit (E&M) [Bob_Stewart]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(101,0,0,101,'voiceFXO','Voice Foreign Exchange Office [Bob_Stewart]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(102,0,0,102,'voiceFXS','Voice Foreign Exchange Station [Bob_Stewart]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(103,0,0,103,'voiceEncap','Voice encapsulation [Bob_Stewart]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(104,0,0,104,'voiceOverIp','Voice over IP encapsulation [Bob_Stewart]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(105,0,0,105,'atmDxi','ATM DXI [Gary_Hanson]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(106,0,0,106,'atmFuni','ATM FUNI [Gary_Hanson]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(107,0,0,107,'atmIma','ATM IMA [Chris_Martin]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(108,0,0,108,'pppMultilinkBundle','PPP Multilink Bundle [John_Shriver]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(109,0,0,109,'ipOverCdlc','IBM ipOverCdlc [Ken_White]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(110,0,0,110,'ipOverClaw','IBM Common Link Access to Workstn [Ken_White]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(111,0,0,111,'stackToStack','IBM stackToStack [Ken_White]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(112,0,0,112,'virtualIpAddress','IBM VIPA [Ken_White]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(113,0,0,113,'mpc','IBM multi-protocol channel support [Ken_White]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(114,0,0,114,'ipOverAtm','IBM ipOverAtm [RFC2320]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(115,0,0,115,'iso88025Fiber','ISO 802.5j Fiber Token Ring [Kevin_Lingle]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(116,0,0,116,'tdlc','IBM twinaxial data link control [John_Pechacek]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(117,0,0,117,'gigabitEthernet','DEPRECATED [RFC3635]',1,'NetworkPortEthernet','2026-10-13 17:00:52','2026-10-13 17:00:52'),
(118,0,0,118,'hdlc','HDLC [Sebastien_Rosset]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(119,0,0,119,'lapf','LAP F [Sebastien_Rosset]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(120,0,0,120,'v37','V.37 [Sebastien_Rosset]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(121,0,0,121,'x25mlp','Multi-Link Protocol [Sebastien_Rosset]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(122,0,0,122,'x25huntGroup','X25 Hunt Group [Sebastien_Rosset]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(123,0,0,123,'transpHdlc','Transp HDLC [Sebastien_Rosset]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(124,0,0,124,'interleave','Interleave channel [Karmous_Edwards]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(125,0,0,125,'fast','Fast channel [Karmous_Edwards]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(126,0,0,126,'ip','IP (for APPN HPR in IP networks) [Robert_Moore]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(127,0,0,127,'docsCableMaclayer','CATV Mac Layer [Azlina_Palmer]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(128,0,0,128,'docsCableDownstream','CATV Downstream interface [Azlina_Palmer]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(129,0,0,129,'docsCableUpstream','CATV Upstream interface [Azlina_Palmer]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(130,0,0,130,'a12MppSwitch','Avalon Parallel Processor [Ross_Harvey]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(131,0,0,131,'tunnel','Encapsulation interface [Dave_Thaler]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(132,0,0,132,'coffee','coffee pot [RFC2325]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(133,0,0,133,'ces','Circiut Emulation Service [Ron_Carmona]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(134,0,0,134,'atmSubInterface','(x)  ATM Sub Interface [Keith_McCloghrie]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(135,0,0,135,'l2vlan','Layer 2 Virtual LAN using 802.1Q [Mike_MacFaden]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(136,0,0,136,'l3ipvlan','Layer 3 Virtual LAN - IP Protocol [Mike_MacFaden]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(137,0,0,137,'l3ipxvlan','Layer 3 Virtual LAN - IPX Prot. [Mike_MacFaden]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(138,0,0,138,'digitalPowerLine','IP over Power Lines [Hans_Scholtes]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(139,0,0,139,'mediaMailOverIp','(xxx)  Multimedia Mail over IP [Hongchi_Shih]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(140,0,0,140,'dtm','Dynamic synchronous Transfer Mode [Jakob_Ellerstedt]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(141,0,0,141,'dcn','Data Communications Network [James_Card]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(142,0,0,142,'ipForward','IP Forwarding Interface [James_Card]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(143,0,0,143,'msdsl','Multi-rate Symmetric DSL [Gopinath_Durairaj]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(144,0,0,144,'ieee1394     IEEE1394','High Performance Serial Bus [Kenji_Fujisawa]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(145,0,0,145,'if-gsn','HIPPI-6400 [Jean_Michel_Pittet]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(146,0,0,146,'dvbRccMacLayer','DVB-RCC MAC Layer [Maarten_Oelering]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(147,0,0,147,'dvbRccDownstream','DVB-RCC Downstream Channel [Maarten_Oelering]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(148,0,0,148,'dvbRccUpstream','DVB-RCC Upstream Channel [Maarten_Oelering]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(149,0,0,149,'atmVirtual','ATM Virtual Interface [Subrahmanya_Hegde]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(150,0,0,150,'mplsTunnel','MPLS Tunnel Virtual Interface [Cheenu_Srinivasan]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(151,0,0,151,'srp','Spatial Reuse Protocol [Bill_Shetti]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(152,0,0,152,'voiceOverAtm','Voice over ATM [Chris_White]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(153,0,0,153,'voiceOverFrameRelay','Voice Over Frame Relay [Chris_White]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(154,0,0,154,'idsl','Digital Subscriber Loop over ISDN [Patrick_Gili]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(155,0,0,155,'compositeLink','Avici Composite Link Interface [Joseph_Dube]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(156,0,0,156,'ss7SigLink','SS7 Signaling Link [Cheenu_Srinivasan]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(157,0,0,157,'propWirelessP2P','Prop. P2P wireless interface [Joseph_Raja]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(158,0,0,158,'frForward','Frame forward Interface [Subrahmanya_Hegde]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(159,0,0,159,'rfc1483','Multiprotocol over ATM AAL5 [RFC1483]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(160,0,0,160,'USB','USB Interface [Bejamin_Dolnik]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(161,0,0,161,'ieee8023adLag','IEEE 802.3ad Link Aggregate [Les_Bell]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(162,0,0,162,'bgpPolicyAccounting','BGP Policy Accounting [Vinod_B_C]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(163,0,0,163,'frf16MfrBundle','FRF.16 Multilik Frame Relay [Pate_Prayson]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(164,0,0,164,'h323Gatekeeper','H323 Gatekeeper [Chris_White]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(165,0,0,165,'h323Proxy','H323 Voice and Video Proxy [Chris_White]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(166,0,0,166,'mpls','MPLS [Cheenu_Srinivasan]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(167,0,0,167,'mfSigLink','Multi-frequency signaling link [Cheenu_Srinivasan]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(168,0,0,168,'hdsl2','High Bit-Rate DSL, 2nd gen. [Bob_Ray]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(169,0,0,169,'shdsl','Multirate HDSL2 [Bob_Ray]',1,'NetworkPortEthernet','2026-10-13 17:00:52','2026-10-13 17:00:52'),
(170,0,0,170,'ds1FDL','Facility Data Link (4Kbps) on a DS1 [Bill_Kwan]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(171,0,0,171,'POS','Packet over SONET/SDH Interface [Ewart_Tempest]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(172,0,0,172,'dvbAsiIn','DVB-ASI Input [Hezi_Oved]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(173,0,0,173,'dvbAsiOut','DVB-ASI Output [Hezi_Oved]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(174,0,0,174,'plc','Power Line Communications [Andrew_Lunn]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(175,0,0,175,'NFAS','Non-Facility Associated Signaling [Sidney_Antommarchi]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(176,0,0,176,'TR008','TROO8 [Sidney_Antommarchi]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(177,0,0,177,'GR303RDT','Remote Digital Terminal [Sidney_Antommarchi]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(178,0,0,178,'GR303IDT','Integrated Digital Terminal [Sidney_Antommarchi]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(179,0,0,179,'ISUP','ISUP [Sidney_Antommarchi]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(180,0,0,180,'propDocsWirelessMaclayer','Cisco proprietary Maclayer [Joseph_Raja]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(181,0,0,181,'propDocsWirelessDownstream','Cisco proprietary Downstream [Joseph_Raja]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(182,0,0,182,'propDocsWirelessUpstream','Cisco proprietary Upstream [Joseph_Raja]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(183,0,0,183,'hiperlan2','HIPERLAN Type 2 Radio Interface [Jamshid_Khun_Jush]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(184,0,0,184,'propBWAp2Mp','PropBroadbandWirelessAccesspt2Multipt\n(use of this type for IEEE 802.16\nWMAN, interfaces as per IEEE 802.16\nis deprecated and iftype 237 should\nbe used instead) [Zvika_Zilberman]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(185,0,0,185,'sonetOverheadChannel','SONET Overhead Channel [ODSI_Coalition_K_Arv]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(186,0,0,186,'digitalWrapperOverheadChannel','Digital Wrapper\nOverhead [ODSI_Coalition_K_Arv]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(187,0,0,187,'aal2','ATM adaptation layer 2 [K_Ashoka]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(188,0,0,188,'radioMAC','MAC layer over radio links [Daniele_Behar]',1,'NetworkPortWifi','2026-10-13 17:00:52','2026-10-13 17:00:52'),
(189,0,0,189,'atmRadio','ATM over radio links [Daniele_Behar]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(190,0,0,190,'IMT','Inter-Machine Trunks [Sidney_Antommarchi]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(191,0,0,191,'mvl','Multiple Virtual Lines DSL [Kevin_Baughman]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(192,0,0,192,'reachDSL','Long Reach DSL [Kevin_Baughman]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(193,0,0,193,'frDlciEndPt','Frame Relay DLCI End Point [Robert_Steinberger]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(194,0,0,194,'atmVciEndPt','ATM VCI End Point [Robert_Steinberger]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(195,0,0,195,'opticalChannel','Optical Channel [Mark_Stewart]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(196,0,0,196,'opticalTransport','Optical Transport [Mark_Stewart]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(197,0,0,197,'propAtm','Proprietary ATM [Subrahmanya_Hegde]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(198,0,0,198,'voiceOverCable','Voice Over Cable Interface [Eugene_Nechamkin]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(199,0,0,199,'infiniband','Infiniband [Bill_Strahm]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(200,0,0,200,'teLink','TE Link [Martin_Dubuc]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(201,0,0,201,'q2931','Q.2931 [Sidney_Antommarchi_2]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(202,0,0,202,'virtualTg','Virtual Trunk Group [Sidney_Antommarchi_2]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(203,0,0,203,'sipTg','SIP Trunk Group [Sidney_Antommarchi_2]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(204,0,0,204,'sipSig','SIP Signaling [Sidney_Antommarchi_2]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(205,0,0,205,'docsCableUpstreamChannel','CATV Upstream Channel [Greg_Nakanishi]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(206,0,0,206,'econet','Acorn Econet [Ben_Harris]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(207,0,0,207,'pon155','FSAN 155Mb Symetrical PON interface [Graham_Higgins]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(208,0,0,208,'pon622','FSAN 622Mb Symetrical PON interface [Graham_Higgins]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(209,0,0,209,'bridge','Transparent bridge interface [Yuzo_Watanabe]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(210,0,0,210,'linegroup','Interface common to multiple lines [Yuzo_Watanabe]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(211,0,0,211,'voiceEMFGD','voice E&M Feature Group D [Taher_Shaikh]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(212,0,0,212,'voiceFGDEANA','voice FGD Exchange Access North American [Taher_Shaikh]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(213,0,0,213,'voiceDID','voice Direct Inward Dialing [Taher_Shaikh]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(214,0,0,214,'mpegTransport','MPEG transport interface [Gaurav_Aggarwal]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(215,0,0,215,'sixToFour','6to4 interface  (DEPRECATED) [RFC4087]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(216,0,0,216,'gtp','GTP (GPRS Tunneling Protocol) [Rajesh_M_L]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(217,0,0,217,'pdnEtherLoop1','Paradyne EtherLoop 1 [Shu_Dong]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(218,0,0,218,'pdnEtherLoop2','Paradyne EtherLoop 2 [Shu_Dong]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(219,0,0,219,'opticalChannelGroup','Optical Channel Group [Hing_Kam_Lam]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(220,0,0,220,'homepna','HomePNA ITU-T G.989 [Stephen_Palm]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(221,0,0,221,'gfp','Generic Framing Procedure (GFP) [Italo_Busi]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(222,0,0,222,'ciscoISLvlan','Layer 2 Virtual LAN using Cisco ISL [Sandeep_Raghavendra]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(223,0,0,223,'actelisMetaLOOP','Acteleis proprietary MetaLOOP\nHigh Speed Link [Edward_Beili]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(224,0,0,224,'fcipLink','FCIP Link [Anil_Rijhsinghani]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(225,0,0,225,'rpr','Resilient Packet Ring Interface Type [IEEE 802.17]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(226,0,0,226,'qam','RF Qam Interface [Jeyachitra_Alagar]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(227,0,0,227,'lmp','Link Management Protocol [RFC4327]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(228,0,0,228,'cblVectaStar','Cambridge Broadband Networks Limited\nVectaStar [John_Naylon]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(229,0,0,229,'docsCableMCmtsDownstream','CATV Modular CMTS Downstream\nInterface [Eduardo_Cardona][\"Data-Over-Cable Service Interface Specifications:\nM-CMTS Operations Support System Interface Specification,\nCM-SP-M-OSSI-I01-050805\", DOCSIS, August 2005.][http://www.cablemodem.com/specifications][https://www.cablelabs.com/specifications/archives/docsis.html]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(230,0,0,230,'adsl2','Asymmetric Digital Subscriber Loop\nVersion 2 (DEPRECATED - REPLACED\nBY 238) [RFC4706]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(231,0,0,231,'macSecControlledIF','MACSecControlled [Paul_Congdon]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(232,0,0,232,'macSecUncontrolledIF','MACSecUncontrolled [Paul_Congdon]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(233,0,0,233,'aviciOpticalEther','Avici Optical Ethernet Aggregate [Somen_Bhattacharya]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(234,0,0,234,'atmbond','atmbond [https://www.itu.int/rec/T-REC-G.998.1-200501-I/en]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(235,0,0,235,'voiceFGDOS','voice FGD Operator Services [Lizzie_Cheung]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(236,0,0,236,'mocaVersion1','MultiMedia over Coax Alliance [Ladd_Wardani]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(237,0,0,237,'ieee80216WMAN','IEEE 802.16 WMAN interface [http://standards.ieee.org/getieee802/802.16.html]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(238,0,0,238,'adsl2plus','Asymmetric Digital Subscriber Loop\nVersion 2 -- Version 2 Plus and all\nvariants [RFC4706]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(239,0,0,239,'dvbRcsMacLayer','DVB-RCS MAC Layer [RFC5728][ETSI EN 301 790][https://web.archive.org/web/20181229131835/http://satlabs.org/pdf/SatLabs_System_Recommendations_v2.0_M&C.pdf]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(240,0,0,240,'dvbTdm','DVB Satellite TDM [RFC5728][ETSI EN 300 421][ETSI EN 302 307][https://web.archive.org/web/20181229131835/http://satlabs.org/pdf/SatLabs_System_Recommendations_v2.0_M&C.pdf]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(241,0,0,241,'dvbRcsTdma','DVB-RCS TDMA [RFC5728][ETSI EN 301 790][ETSI EN 300 421][https://web.archive.org/web/20181229131835/http://satlabs.org/pdf/SatLabs_System_Recommendations_v2.0_M&C.pdf]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(242,0,0,242,'x86Laps','LAPS based on ITU-T X.86/Y.1323 [Orly_Nicklass][http://grouper.ieee.org/groups/802/3/ad_hoc/etholaps/public/docs/opening_report_0301.pdf]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(243,0,0,243,'wwanPP','3GPP WWAN [Gabriel_Montenegro][https://www.3gpp.org/ftp/specs/archive/23_series/23.060/23060-740.zip]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(244,0,0,244,'wwanPP2','3GPP2 WWAN [Gabriel_Montenegro][http://www.3gpp2.org/Public_html/Specs/C.S0017-005-A_v1.0_040617.pdf]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(245,0,0,245,'voiceEBS','voice P-phone EBS physical interface [Tom_Chou]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(246,0,0,246,'ifPwType','Pseudowire interface type [RFC5601]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(247,0,0,247,'ILAN','Internal LAN on a bridge per IEEE\n802.1ap [Glenn_Parsons][http://www.ieee802.org/1/files/private/ap-drafts/d3/802-1ap-D3-4.pdf]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(248,0,0,248,'PIP','Provider Instance Port on a bridge\nper IEEE 802.1ah PBB [Glenn_Parsons][http://www.ieee802.org/1/files/private/ah-drafts/d4/802-1ah-d4-2.pdf]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(249,0,0,249,'aluELP','Alcatel-Lucent Ethernet Link Protection [Xiaohua_Ma]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(250,0,0,250,'gpon','Gigabit-capable passive optical networks\n(G-PON)  as per ITU-T G.984 [Hyeri_Koh]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(251,0,0,251,'vdsl2','Very high speed digital subscriber\nline Version 2 (as per ITU-T Recommendation\nG.993.2) [Markus_Freudenberger][RFC5650]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(252,0,0,252,'capwapDot11Profile','WLAN Profile Interface [RFC5834]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(253,0,0,253,'capwapDot11Bss','WLAN BSS Interface [RFC5834]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(254,0,0,254,'capwapWtpVirtualRadio','WTP Virtual Radio Interface [RFC5833]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(255,0,0,255,'bits','bitsport [Du_Feng]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(256,0,0,256,'docsCableUpstreamRfPort','DOCSIS CATV Upstream RF\nPort [Michael_Patrick][https://www.cablelabs.com/specifications/CM-SP-EQAM-PMI-I01-081209.pdf]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(257,0,0,257,'cableDownstreamRfPort','CATV downstream RF port [Michael_Patrick]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(258,0,0,258,'vmwareVirtualNic','VMware Virtual Network Interface [Mike_MacFaden]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(259,0,0,259,'ieee802154','IEEE 802.15.4 WPAN interface [Juergen_Schoenwaelde][\"IEEE Std. 802.15.4-2006\", October 2006.]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(260,0,0,260,'otnOdu','OTN Optical Data Unit [Jim_Vance][https://www.itu.int/ITU-T/studygroups/com15/otn/OTNtutorial.pdf]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(261,0,0,261,'otnOtu','OTN Optical channel Transport Unit [Jim_Vance][https://www.itu.int/ITU-T/studygroups/com15/otn/OTNtutorial.pdf]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(262,0,0,262,'ifVfiType','VPLS Forwarding Instance Interface\nType [Manas_Pati]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(263,0,0,263,'g9981','G.998.1 bonded interface [RFC6768][RFC Errata 3591]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(264,0,0,264,'g9982','G.998.2 bonded interface [RFC6767][RFC Errata 3589]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(265,0,0,265,'g9983','G.998.3 bonded interface [RFC6766][RFC Errata 3588]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(266,0,0,266,'aluEpon (E-PON)','Ethernet Passive Optical Networks [Karel_Meijfroidt]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(267,0,0,267,'aluEponOnu','EPON Optical Network Unit [Karel_Meijfroidt]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(268,0,0,268,'aluEponPhysicalUni','EPON physical User to Network\ninterface [Karel_Meijfroidt]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(269,0,0,269,'aluEponLogicalLink','The emulation of a point-to-point\nlink over the EPON layer [Karel_Meijfroidt]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(270,0,0,270,'aluGponOnu','GPON Optical Network Unit [Karel_Meijfroidt][https://www.itu.int/rec/T-REC-G.984.2/en]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(271,0,0,271,'aluGponPhysicalUni','GPON physical User to Network\ninterface [Karel_Meijfroidt][https://www.itu.int/rec/T-REC-G.984.2/en]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(272,0,0,272,'vmwareNicTeam','VMware NIC Team [Michael_MacFaden][https://www.vmware.com/pdf/esx2_NIC_Teaming.pdf]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(273,0,0,273,'Reserved','The corresponding transmission value\nis allocated according to the following\nreference. [RFC6825]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(274,0,0,274,'Reserved','The corresponding transmission value\nis allocated according to the following reference. [RFC7257]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(275,0,0,275,'Reserved','The corresponding transmission value\nis allocated according to the following reference. [RFC7257]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(276,0,0,276,'Reserved','The corresponding transmission value\nis allocated according to the following reference. [RFC7257]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(277,0,0,277,'docsOfdmDownstream','CATV Downstream OFDM interface [https://www.cablelabs.com/specification/cable-modem-operations-support-system-interface-specification][Miguel_O_Alvarez]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(278,0,0,278,'docsOfdmaUpstream','CATV Upstream OFDMA interface [https://www.cablelabs.com/specification/cable-modem-operations-support-system-interface-specification][Miguel_O_Alvarez]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(279,0,0,279,'gfast','G.fast port [ITU-T G.9701]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(280,0,0,280,'sdci','SDCI (IO-Link) [IEC 61131-9 Edition 1.0 2013-09][Markus_Rentschler]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(281,0,0,281,'xboxWireless','Xbox wireless [Brandon_Jiang]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(282,0,0,282,'fastdsl','FastDSL [BBF TR-355][Broadband_Forum]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(283,0,0,283,'docsCableScte55d1FwdOob','Cable SCTE 55-1 OOB Forward Channel [https://www.scte.org/documents/pdf/Standards/ANSI_SCTE-55-1-2009.pdf][Brian_Hedstrom]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(284,0,0,284,'docsCableScte55d1RetOob','Cable SCTE 55-1 OOB Return Channel [https://www.scte.org/documents/pdf/Standards/ANSI_SCTE-55-1-2009.pdf][Brian_Hedstrom]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(285,0,0,285,'docsCableScte55d2DsOob','Cable SCTE 55-2 OOB Downstream Channel [https://web.archive.org/web/20190822104256/http://www.scte.org/documents/pdf/Standards/ANSI_SCTE%2055-2%202008.pdf][Brian_Hedstrom]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(286,0,0,286,'docsCableScte55d2UsOob','Cable SCTE 55-2 OOB Upstream Channel [https://web.archive.org/web/20190822104256/http://www.scte.org/documents/pdf/Standards/ANSI_SCTE%2055-2%202008.pdf][Brian_Hedstrom]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(287,0,0,287,'docsCableNdf','Cable Narrowband Digital Forward [http://www.cablelabs.com/wp-content/uploads/specdocs/CM-SP-R-OOB-I04-160923.pdf][Brian_Hedstrom]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(288,0,0,288,'docsCableNdr','Cable Narrowband Digital Return [http://www.cablelabs.com/wp-content/uploads/specdocs/CM-SP-R-OOB-I04-160923.pdf][Brian_Hedstrom]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(289,0,0,289,'ptm','Packet Transfer Mode [ITU-T G.993.1, Annex H][ITU-T G.993.2][ITU-T G.9701][Broadband_Forum]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(290,0,0,290,'ghn','G.hn port [ITU-T G.9961][Broadband_Forum]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(291,0,0,291,'otnOtsi','Optical Tributary Signal [ITU-T G.959.1][Koteswara_Boyapati]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(292,0,0,292,'otnOtuc','OTN OTUCn [ITU-T G.709/Y.1331][Koteswara_Boyapati]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(293,0,0,293,'otnOduc','OTN ODUC [ITU-T G.709][Koteswara_Boyapati]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(294,0,0,294,'otnOtsig','OTN OTUC Signal [ITU-T G.709][Koteswara_Boyapati]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(295,0,0,295,'microwaveCarrierTermination','air interface of a single microwave carrier [RFC8561]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(296,0,0,296,'microwaveRadioLinkTerminal','radio link interface for one or several aggregated microwave carriers [RFC8561]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(297,0,0,297,'ieee8021axDrni','IEEE 802.1AX Distributed Resilient Network Interface [IEEE 802.1AX-Rev-d2-0][John_Messenger]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(298,0,0,298,'ax25','AX.25 network interfaces [AX.25 Link Access Protocol for Amateur Packet Radio version 2.2][Iain_Learmonth]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(299,0,0,299,'ieee19061nanocom','Nanoscale and Molecular Communication [IEEE 1906.1-2015][Stephen_F_Bush]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(300,0,0,300,'cpri','Common Public Radio Interface [CPRI v7.0][Renwang_Liu]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(301,0,0,301,'omni','Overlay Multilink Network Interface (OMNI) [draft-templin-6man-omni-00][Fred_L_Templin]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(302,0,0,302,'roe','Radio over Ethernet Interface [1914.3-2018 - IEEE Standard for Radio over Ethernet Encapsulations and Mappings][Renwang_Liu]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52'),
(303,0,0,303,'p2pOverLan','Point to Point over LAN interface [RFC9296]',0,NULL,'2026-10-13 17:00:52','2026-10-13 17:00:52');
/*!40000 ALTER TABLE `glpi_networkporttypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_networkportwifis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_networkportwifis` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `networkports_id` int(10) unsigned NOT NULL DEFAULT 0,
  `items_devicenetworkcards_id` int(10) unsigned NOT NULL DEFAULT 0,
  `wifinetworks_id` int(10) unsigned NOT NULL DEFAULT 0,
  `networkportwifis_id` int(10) unsigned NOT NULL DEFAULT 0,
  `version` varchar(20) DEFAULT NULL,
  `mode` varchar(20) DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `networkports_id` (`networkports_id`),
  KEY `card` (`items_devicenetworkcards_id`),
  KEY `essid` (`wifinetworks_id`),
  KEY `version` (`version`),
  KEY `mode` (`mode`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `networkportwifis_id` (`networkportwifis_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_networkportwifis` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_networkportwifis` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_networks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_networks` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_networks` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_networks` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_notepads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_notepads` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `itemtype` varchar(100) DEFAULT NULL,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id_lastupdater` int(10) unsigned NOT NULL DEFAULT 0,
  `content` longtext DEFAULT NULL,
  `visible_from_ticket` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `users_id_lastupdater` (`users_id_lastupdater`),
  KEY `users_id` (`users_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_notepads` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_notepads` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_notifications` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(100) NOT NULL,
  `event` varchar(255) NOT NULL,
  `comment` text DEFAULT NULL,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `is_active` tinyint(4) NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `allow_response` tinyint(4) NOT NULL DEFAULT 1,
  `attach_documents` tinyint(4) NOT NULL DEFAULT -2,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `itemtype` (`itemtype`),
  KEY `entities_id` (`entities_id`),
  KEY `is_active` (`is_active`),
  KEY `date_mod` (`date_mod`),
  KEY `is_recursive` (`is_recursive`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB AUTO_INCREMENT=83 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_notifications` DISABLE KEYS */;
INSERT INTO `glpi_notifications` VALUES
(1,'Alert Tickets not closed',0,'Ticket','alertnotclosed',NULL,1,1,NULL,NULL,1,-2),
(2,'New Ticket',0,'Ticket','new',NULL,1,1,NULL,NULL,1,-2),
(3,'Update Ticket',0,'Ticket','update',NULL,1,0,NULL,NULL,1,-2),
(4,'Close Ticket',0,'Ticket','closed',NULL,1,1,NULL,NULL,1,-2),
(5,'Add Followup',0,'Ticket','add_followup',NULL,1,1,NULL,NULL,1,-2),
(6,'Add Task',0,'Ticket','add_task',NULL,1,1,NULL,NULL,1,-2),
(7,'Update Followup',0,'Ticket','update_followup',NULL,1,1,NULL,NULL,1,-2),
(8,'Update Task',0,'Ticket','update_task',NULL,1,1,NULL,NULL,1,-2),
(9,'Delete Followup',0,'Ticket','delete_followup',NULL,1,1,NULL,NULL,1,-2),
(10,'Delete Task',0,'Ticket','delete_task',NULL,1,1,NULL,NULL,1,-2),
(11,'Resolve ticket',0,'Ticket','solved',NULL,1,1,NULL,NULL,1,-2),
(12,'Ticket Approval',0,'Ticket','validation',NULL,1,1,NULL,NULL,1,-2),
(13,'New Reservation',0,'Reservation','new',NULL,1,1,NULL,NULL,1,-2),
(14,'Update Reservation',0,'Reservation','update',NULL,1,1,NULL,NULL,1,-2),
(15,'Delete Reservation',0,'Reservation','delete',NULL,1,1,NULL,NULL,1,-2),
(16,'Alert Reservation',0,'Reservation','alert',NULL,1,1,NULL,NULL,1,-2),
(17,'Contract Notice',0,'Contract','notice',NULL,1,1,NULL,NULL,1,-2),
(18,'Contract End',0,'Contract','end',NULL,1,1,NULL,NULL,1,-2),
(19,'MySQL Synchronization',0,'DBConnection','desynchronization',NULL,1,1,NULL,NULL,1,-2),
(20,'Cartridges',0,'CartridgeItem','alert',NULL,1,1,NULL,NULL,1,-2),
(21,'Consumables',0,'ConsumableItem','alert',NULL,1,1,NULL,NULL,1,-2),
(22,'Infocoms',0,'Infocom','alert',NULL,1,1,NULL,NULL,1,-2),
(23,'Software Licenses',0,'SoftwareLicense','alert',NULL,1,1,NULL,NULL,1,-2),
(24,'Ticket Recall',0,'Ticket','recall',NULL,1,1,NULL,NULL,1,-2),
(25,'Password Forget',0,'User','passwordforget',NULL,1,1,NULL,NULL,1,-2),
(26,'Ticket Satisfaction',0,'Ticket','satisfaction',NULL,1,1,NULL,NULL,1,-2),
(27,'Item not unique',0,'FieldUnicity','refuse',NULL,1,1,NULL,NULL,1,-2),
(28,'CronTask Watcher',0,'CronTask','alert',NULL,1,1,NULL,NULL,1,-2),
(29,'New Problem',0,'Problem','new',NULL,1,1,NULL,NULL,1,-2),
(30,'Update Problem',0,'Problem','update',NULL,1,1,NULL,NULL,1,-2),
(31,'Resolve Problem',0,'Problem','solved',NULL,1,1,NULL,NULL,1,-2),
(32,'Add Task',0,'Problem','add_task',NULL,1,1,NULL,NULL,1,-2),
(33,'Update Task',0,'Problem','update_task',NULL,1,1,NULL,NULL,1,-2),
(34,'Delete Task',0,'Problem','delete_task',NULL,1,1,NULL,NULL,1,-2),
(35,'Close Problem',0,'Problem','closed',NULL,1,1,NULL,NULL,1,-2),
(36,'Delete Problem',0,'Problem','delete',NULL,1,1,NULL,NULL,1,-2),
(37,'Ticket Approval Answer',0,'Ticket','validation_answer',NULL,1,1,NULL,NULL,1,-2),
(38,'Contract End Periodicity',0,'Contract','periodicity',NULL,1,1,NULL,NULL,1,-2),
(39,'Contract Notice Periodicity',0,'Contract','periodicitynotice',NULL,1,1,NULL,NULL,1,-2),
(40,'Planning recall',0,'PlanningRecall','planningrecall',NULL,1,1,NULL,NULL,1,-2),
(41,'Delete Ticket',0,'Ticket','delete',NULL,1,1,NULL,NULL,1,-2),
(42,'New Change',0,'Change','new',NULL,1,1,NULL,NULL,1,-2),
(43,'Update Change',0,'Change','update',NULL,1,1,NULL,NULL,1,-2),
(44,'Resolve Change',0,'Change','solved',NULL,1,1,NULL,NULL,1,-2),
(45,'Add Task',0,'Change','add_task',NULL,1,1,NULL,NULL,1,-2),
(46,'Update Task',0,'Change','update_task',NULL,1,1,NULL,NULL,1,-2),
(47,'Delete Task',0,'Change','delete_task',NULL,1,1,NULL,NULL,1,-2),
(48,'Close Change',0,'Change','closed',NULL,1,1,NULL,NULL,1,-2),
(49,'Delete Change',0,'Change','delete',NULL,1,1,NULL,NULL,1,-2),
(50,'Ticket Satisfaction Answer',0,'Ticket','replysatisfaction',NULL,1,1,NULL,NULL,1,-2),
(51,'Receiver errors',0,'MailCollector','error',NULL,1,1,NULL,NULL,1,-2),
(52,'New Project',0,'Project','new',NULL,1,1,NULL,NULL,1,-2),
(53,'Update Project',0,'Project','update',NULL,1,1,NULL,NULL,1,-2),
(54,'Delete Project',0,'Project','delete',NULL,1,1,NULL,NULL,1,-2),
(55,'New Project Task',0,'ProjectTask','new',NULL,1,1,NULL,NULL,1,-2),
(56,'Update Project Task',0,'ProjectTask','update',NULL,1,1,NULL,NULL,1,-2),
(57,'Delete Project Task',0,'ProjectTask','delete',NULL,1,1,NULL,NULL,1,-2),
(58,'Request Unlock Items',0,'ObjectLock','unlock',NULL,1,1,NULL,NULL,1,-2),
(59,'New user in requesters',0,'Ticket','requester_user',NULL,1,1,NULL,NULL,1,-2),
(60,'New group in requesters',0,'Ticket','requester_group',NULL,1,1,NULL,NULL,1,-2),
(61,'New user in observers',0,'Ticket','observer_user',NULL,1,1,NULL,NULL,1,-2),
(62,'New group in observers',0,'Ticket','observer_group',NULL,1,1,NULL,NULL,1,-2),
(63,'New user in assignees',0,'Ticket','assign_user',NULL,1,1,NULL,NULL,1,-2),
(64,'New group in assignees',0,'Ticket','assign_group',NULL,1,1,NULL,NULL,1,-2),
(65,'New supplier in assignees',0,'Ticket','assign_supplier',NULL,1,1,NULL,NULL,1,-2),
(66,'Saved searches',0,'SavedSearch_Alert','alert',NULL,1,1,NULL,NULL,1,-2),
(67,'Certificates',0,'Certificate','alert',NULL,1,1,NULL,NULL,1,-2),
(68,'Alert expired domains',0,'Domain','ExpiredDomains',NULL,1,1,NULL,NULL,1,-2),
(69,'Alert domains close expiries',0,'Domain','DomainsWhichExpire',NULL,1,1,NULL,NULL,1,-2),
(70,'Password expires alert',0,'User','passwordexpires',NULL,1,1,NULL,NULL,1,-2),
(71,'Check plugin updates',0,'Glpi\\Marketplace\\Controller','checkpluginsupdate',NULL,1,1,NULL,NULL,1,-2),
(72,'New user mentioned',0,'Ticket','user_mention',NULL,1,1,NULL,NULL,1,-2),
(73,'Password Initialization',0,'User','passwordinit',NULL,1,1,NULL,NULL,1,-2),
(74,'Change Satisfaction',0,'Change','satisfaction',NULL,1,1,NULL,NULL,1,-2),
(75,'Change Satisfaction Answer',0,'Change','replysatisfaction',NULL,1,1,NULL,NULL,1,-2),
(76,'Automatic reminder',0,'Ticket','auto_reminder',NULL,1,0,NULL,NULL,1,-2),
(77,'New document',0,'Ticket','add_document',NULL,0,0,NULL,NULL,1,-2),
(78,'New document',0,'Change','add_document',NULL,0,0,NULL,NULL,1,-2),
(79,'New document',0,'Problem','add_document',NULL,0,0,NULL,NULL,1,-2),
(80,'New knowledge base item',0,'KnowbaseItem','new',NULL,1,0,NULL,NULL,1,-2),
(81,'Delete knowledge base item',0,'KnowbaseItem','delete',NULL,1,0,NULL,NULL,1,-2),
(82,'Update knowledge base item',0,'KnowbaseItem','update',NULL,1,0,NULL,NULL,1,-2);
/*!40000 ALTER TABLE `glpi_notifications` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_notifications_notificationtemplates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_notifications_notificationtemplates` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `notifications_id` int(10) unsigned NOT NULL DEFAULT 0,
  `mode` varchar(20) NOT NULL,
  `notificationtemplates_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`notifications_id`,`mode`,`notificationtemplates_id`),
  KEY `notificationtemplates_id` (`notificationtemplates_id`),
  KEY `mode` (`mode`)
) ENGINE=InnoDB AUTO_INCREMENT=83 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_notifications_notificationtemplates` DISABLE KEYS */;
INSERT INTO `glpi_notifications_notificationtemplates` VALUES
(1,1,'mailing',6),
(2,2,'mailing',4),
(3,3,'mailing',4),
(4,4,'mailing',4),
(5,5,'mailing',4),
(6,6,'mailing',4),
(7,7,'mailing',4),
(8,8,'mailing',4),
(9,9,'mailing',4),
(10,10,'mailing',4),
(11,11,'mailing',4),
(12,12,'mailing',7),
(13,13,'mailing',2),
(14,14,'mailing',2),
(15,15,'mailing',2),
(16,16,'mailing',3),
(17,17,'mailing',12),
(18,18,'mailing',12),
(19,19,'mailing',1),
(20,20,'mailing',8),
(21,21,'mailing',9),
(22,22,'mailing',10),
(23,23,'mailing',11),
(24,24,'mailing',4),
(25,25,'mailing',13),
(26,26,'mailing',14),
(27,27,'mailing',15),
(28,28,'mailing',16),
(29,29,'mailing',17),
(30,30,'mailing',17),
(31,31,'mailing',17),
(32,32,'mailing',17),
(33,33,'mailing',17),
(34,34,'mailing',17),
(35,35,'mailing',17),
(36,36,'mailing',17),
(37,37,'mailing',7),
(38,38,'mailing',12),
(39,39,'mailing',12),
(40,40,'mailing',18),
(41,41,'mailing',4),
(42,42,'mailing',19),
(43,43,'mailing',19),
(44,44,'mailing',19),
(45,45,'mailing',19),
(46,46,'mailing',19),
(47,47,'mailing',19),
(48,48,'mailing',19),
(49,49,'mailing',19),
(50,50,'mailing',14),
(51,51,'mailing',20),
(52,52,'mailing',21),
(53,53,'mailing',21),
(54,54,'mailing',21),
(55,55,'mailing',22),
(56,56,'mailing',22),
(57,57,'mailing',22),
(58,58,'mailing',23),
(59,59,'mailing',4),
(60,60,'mailing',4),
(61,61,'mailing',4),
(62,62,'mailing',4),
(63,63,'mailing',4),
(64,64,'mailing',4),
(65,65,'mailing',4),
(66,66,'mailing',24),
(67,67,'mailing',25),
(68,68,'mailing',26),
(69,69,'mailing',26),
(70,70,'mailing',27),
(71,71,'mailing',28),
(72,72,'mailing',4),
(73,73,'mailing',29),
(74,74,'mailing',30),
(75,75,'mailing',30),
(76,76,'mailing',31),
(77,77,'mailing',4),
(78,78,'mailing',19),
(79,79,'mailing',17),
(80,80,'mailing',32),
(81,81,'mailing',32),
(82,82,'mailing',32);
/*!40000 ALTER TABLE `glpi_notifications_notificationtemplates` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_notificationtargets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_notificationtargets` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `type` int(11) NOT NULL DEFAULT 0,
  `notifications_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_exclusion` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`notifications_id`,`items_id`,`type`),
  KEY `items` (`type`,`items_id`),
  KEY `is_exclusion` (`is_exclusion`)
) ENGINE=InnoDB AUTO_INCREMENT=193 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_notificationtargets` DISABLE KEYS */;
INSERT INTO `glpi_notificationtargets` VALUES
(1,3,1,13,0),
(2,1,1,13,0),
(3,3,2,2,0),
(4,1,1,2,0),
(5,1,1,3,0),
(6,1,1,5,0),
(7,1,1,4,0),
(8,2,1,3,0),
(9,4,1,3,0),
(10,3,1,2,0),
(11,3,1,3,0),
(12,3,1,5,0),
(13,3,1,4,0),
(14,1,1,19,0),
(15,40,1,12,0),
(16,3,1,14,0),
(17,1,1,14,0),
(18,3,1,15,0),
(19,1,1,15,0),
(20,1,1,6,0),
(21,3,1,6,0),
(22,1,1,7,0),
(23,3,1,7,0),
(24,1,1,8,0),
(25,3,1,8,0),
(26,1,1,9,0),
(27,3,1,9,0),
(28,1,1,10,0),
(29,3,1,10,0),
(30,1,1,11,0),
(31,3,1,11,0),
(32,19,1,25,0),
(33,3,1,26,0),
(34,21,1,2,0),
(35,21,1,3,0),
(36,21,1,5,0),
(37,21,1,4,0),
(38,21,1,6,0),
(39,21,1,7,0),
(40,21,1,8,0),
(41,21,1,9,0),
(42,21,1,10,0),
(43,21,1,11,0),
(46,1,1,28,0),
(47,3,1,29,0),
(48,1,1,29,0),
(49,21,1,29,0),
(50,2,1,30,0),
(51,4,1,30,0),
(52,3,1,30,0),
(53,1,1,30,0),
(54,21,1,30,0),
(55,3,1,31,0),
(56,1,1,31,0),
(57,21,1,31,0),
(58,3,1,32,0),
(59,1,1,32,0),
(60,21,1,32,0),
(61,3,1,33,0),
(62,1,1,33,0),
(63,21,1,33,0),
(64,3,1,34,0),
(65,1,1,34,0),
(66,21,1,34,0),
(67,3,1,35,0),
(68,1,1,35,0),
(69,21,1,35,0),
(70,3,1,36,0),
(71,1,1,36,0),
(72,21,1,36,0),
(73,40,1,37,0),
(74,3,1,40,0),
(75,1,1,41,0),
(76,3,1,42,0),
(77,1,1,42,0),
(78,21,1,42,0),
(79,2,1,43,0),
(80,4,1,43,0),
(81,3,1,43,0),
(82,1,1,43,0),
(83,21,1,43,0),
(84,3,1,44,0),
(85,1,1,44,0),
(86,21,1,44,0),
(87,3,1,45,0),
(88,1,1,45,0),
(89,21,1,45,0),
(90,3,1,46,0),
(91,1,1,46,0),
(92,21,1,46,0),
(93,3,1,47,0),
(94,1,1,47,0),
(95,21,1,47,0),
(96,3,1,48,0),
(97,1,1,48,0),
(98,21,1,48,0),
(99,3,1,49,0),
(100,1,1,49,0),
(101,21,1,49,0),
(102,3,1,50,0),
(103,2,1,50,0),
(104,1,1,51,0),
(105,27,1,52,0),
(106,1,1,52,0),
(107,28,1,52,0),
(108,27,1,53,0),
(109,1,1,53,0),
(110,28,1,53,0),
(111,27,1,54,0),
(112,1,1,54,0),
(113,28,1,54,0),
(114,31,1,55,0),
(115,1,1,55,0),
(116,32,1,55,0),
(117,31,1,56,0),
(118,1,1,56,0),
(119,32,1,56,0),
(120,31,1,57,0),
(121,1,1,57,0),
(122,32,1,57,0),
(123,19,1,58,0),
(124,3,1,59,0),
(125,13,1,60,0),
(126,21,1,61,0),
(127,20,1,62,0),
(128,2,1,63,0),
(129,9,1,64,0),
(130,8,1,65,0),
(131,19,1,66,0),
(132,5,1,67,0),
(133,23,1,67,0),
(134,5,1,68,0),
(135,23,1,68,0),
(136,5,1,69,0),
(137,23,1,69,0),
(138,19,1,70,0),
(139,1,1,71,0),
(140,39,1,72,0),
(141,19,1,73,0),
(142,3,1,74,0),
(143,3,1,75,0),
(144,2,1,75,0),
(145,3,1,76,0),
(146,1,1,76,0),
(147,21,1,76,0),
(148,3,1,77,0),
(149,1,1,77,0),
(150,21,1,77,0),
(151,3,1,78,0),
(152,1,1,78,0),
(153,21,1,78,0),
(154,3,1,79,0),
(155,1,1,79,0),
(156,21,1,79,0),
(157,16,1,40,0),
(158,37,1,40,0),
(159,1,1,1,0),
(160,1,1,12,0),
(161,1,1,16,0),
(162,1,1,17,0),
(163,1,1,18,0),
(164,1,1,20,0),
(165,1,1,21,0),
(166,1,1,22,0),
(167,1,1,23,0),
(168,1,1,24,0),
(169,1,1,26,0),
(170,1,1,27,0),
(171,1,1,37,0),
(172,1,1,38,0),
(173,1,1,39,0),
(174,1,1,50,0),
(175,1,1,59,0),
(176,1,1,60,0),
(177,1,1,61,0),
(178,1,1,62,0),
(179,1,1,63,0),
(180,1,1,64,0),
(181,1,1,65,0),
(183,1,1,67,0),
(184,1,1,68,0),
(185,1,1,69,0),
(186,1,1,70,0),
(187,1,1,72,0),
(188,1,1,74,0),
(189,1,1,75,0),
(190,1,1,80,0),
(191,1,1,81,0),
(192,1,1,82,0);
/*!40000 ALTER TABLE `glpi_notificationtargets` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_notificationtemplates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_notificationtemplates` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `itemtype` varchar(100) NOT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `css` text DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `itemtype` (`itemtype`),
  KEY `date_mod` (`date_mod`),
  KEY `name` (`name`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_notificationtemplates` DISABLE KEYS */;
INSERT INTO `glpi_notificationtemplates` VALUES
(1,'MySQL Synchronization','DBConnection',NULL,NULL,NULL,NULL),
(2,'Reservations','Reservation',NULL,NULL,NULL,NULL),
(3,'Alert Reservation','Reservation',NULL,NULL,NULL,NULL),
(4,'Tickets','Ticket',NULL,NULL,NULL,NULL),
(5,'Tickets (Simple)','Ticket',NULL,NULL,NULL,NULL),
(6,'Alert Tickets not closed','Ticket',NULL,NULL,NULL,NULL),
(7,'Tickets Approval','Ticket',NULL,NULL,NULL,NULL),
(8,'Cartridges','CartridgeItem',NULL,NULL,NULL,NULL),
(9,'Consumables','ConsumableItem',NULL,NULL,NULL,NULL),
(10,'Infocoms','Infocom',NULL,NULL,NULL,NULL),
(11,'Licenses','SoftwareLicense',NULL,NULL,NULL,NULL),
(12,'Contracts','Contract',NULL,NULL,NULL,NULL),
(13,'Password Forget','User',NULL,NULL,NULL,NULL),
(14,'Ticket Satisfaction','Ticket',NULL,NULL,NULL,NULL),
(15,'Item not unique','FieldUnicity',NULL,NULL,NULL,NULL),
(16,'CronTask','CronTask',NULL,NULL,NULL,NULL),
(17,'Problems','Problem',NULL,NULL,NULL,NULL),
(18,'Planning recall','PlanningRecall',NULL,NULL,NULL,NULL),
(19,'Changes','Change',NULL,NULL,NULL,NULL),
(20,'Receiver errors','MailCollector',NULL,NULL,NULL,NULL),
(21,'Projects','Project',NULL,NULL,NULL,NULL),
(22,'Project Tasks','ProjectTask',NULL,NULL,NULL,NULL),
(23,'Unlock Item request','ObjectLock',NULL,NULL,NULL,NULL),
(24,'Saved searches alerts','SavedSearch_Alert',NULL,NULL,NULL,NULL),
(25,'Certificates','Certificate',NULL,NULL,NULL,NULL),
(26,'Alert domains','Domain',NULL,NULL,NULL,NULL),
(27,'Password expires alert','User',NULL,NULL,NULL,NULL),
(28,'Plugin updates','Glpi\\Marketplace\\Controller',NULL,NULL,NULL,NULL),
(29,'Password Initialization','User',NULL,NULL,NULL,NULL),
(30,'Change Satisfaction','Change',NULL,NULL,NULL,NULL),
(31,'Automatic reminder','Ticket',NULL,NULL,NULL,NULL),
(32,'Knowledge base item','KnowbaseItem',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `glpi_notificationtemplates` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_notificationtemplatetranslations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_notificationtemplatetranslations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `notificationtemplates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `language` varchar(10) NOT NULL DEFAULT '',
  `subject` varchar(255) NOT NULL,
  `content_text` longtext DEFAULT NULL,
  `content_html` longtext DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notificationtemplates_id` (`notificationtemplates_id`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_notificationtemplatetranslations` DISABLE KEYS */;
INSERT INTO `glpi_notificationtemplatetranslations` VALUES
(1,1,'','##lang.dbconnection.title##','##lang.dbconnection.delay## : ##dbconnection.delay##','<p>##lang.dbconnection.delay## : ##dbconnection.delay##</p>'),
(2,2,'','##reservation.action##','======================================================================\n##lang.reservation.user##: ##reservation.user##\n##lang.reservation.item.name##: ##reservation.itemtype## - ##reservation.item.name##\n##IFreservation.tech## ##lang.reservation.tech## ##reservation.tech## ##ENDIFreservation.tech##\n##lang.reservation.begin##: ##reservation.begin##\n##lang.reservation.end##: ##reservation.end##\n##lang.reservation.comment##: ##reservation.comment##\n======================================================================','<!-- description{ color: inherit; background: #ebebeb;border-style: solid;border-color: #8d8d8d; border-width: 0px 1px 1px 0px; } -->\n<p><span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\">##lang.reservation.user##:</span>##reservation.user##<br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\">##lang.reservation.item.name##:</span>##reservation.itemtype## - ##reservation.item.name##<br />##IFreservation.tech## ##lang.reservation.tech## ##reservation.tech####ENDIFreservation.tech##<br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\">##lang.reservation.begin##:</span> ##reservation.begin##<br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\">##lang.reservation.end##:</span>##reservation.end##<br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\">##lang.reservation.comment##:</span> ##reservation.comment##</p>'),
(3,3,'','##reservation.action##  ##reservation.entity##','##lang.reservation.entity## : ##reservation.entity##\n\n\n##FOREACHreservations##\n##lang.reservation.itemtype## : ##reservation.itemtype##\n\n ##lang.reservation.item## : ##reservation.item##\n\n ##reservation.url##\n\n ##ENDFOREACHreservations##','<p>##lang.reservation.entity## : ##reservation.entity## <br /> <br />\n##FOREACHreservations## <br />##lang.reservation.itemtype## :  ##reservation.itemtype##<br />\n ##lang.reservation.item## :  ##reservation.item##<br /> <br />\n <a href=\"##reservation.url##\"> ##reservation.url##</a><br />\n ##ENDFOREACHreservations##</p>'),
(4,4,'','##ticket.action## ##ticket.title##',' ##IFticket.storestatus=5##\n ##lang.ticket.url## : ##ticket.urlapprove##\n ##lang.ticket.autoclosewarning##\n ##lang.ticket.solvedate## : ##ticket.solvedate##\n ##lang.ticket.solution.type## : ##ticket.solution.type##\n ##lang.ticket.solution.description## : ##ticket.solution.description## ##ENDIFticket.storestatus##\n ##ELSEticket.storestatus## ##lang.ticket.url## : ##ticket.url## ##ENDELSEticket.storestatus##\n\n ##lang.ticket.description##\n\n ##lang.ticket.title## : ##ticket.title##\n ##lang.ticket.authors## : ##IFticket.authors## ##ticket.authors## ##ENDIFticket.authors## ##ELSEticket.authors##--##ENDELSEticket.authors##\n ##lang.ticket.creationdate## : ##ticket.creationdate##\n ##lang.ticket.closedate## : ##ticket.closedate##\n ##lang.ticket.requesttype## : ##ticket.requesttype##\n##lang.ticket.item.name## :\n\n##FOREACHitems##\n\n ##IFticket.itemtype##\n  ##ticket.itemtype## - ##ticket.item.name##\n  ##IFticket.item.model## ##lang.ticket.item.model## : ##ticket.item.model## ##ENDIFticket.item.model##\n  ##IFticket.item.serial## ##lang.ticket.item.serial## : ##ticket.item.serial## ##ENDIFticket.item.serial##\n  ##IFticket.item.otherserial## ##lang.ticket.item.otherserial## : ##ticket.item.otherserial## ##ENDIFticket.item.otherserial##\n ##ENDIFticket.itemtype##\n\n##ENDFOREACHitems##\n##IFticket.assigntousers## ##lang.ticket.assigntousers## : ##ticket.assigntousers## ##ENDIFticket.assigntousers##\n ##lang.ticket.status## : ##ticket.status##\n##IFticket.assigntogroups## ##lang.ticket.assigntogroups## : ##ticket.assigntogroups## ##ENDIFticket.assigntogroups##\n ##lang.ticket.urgency## : ##ticket.urgency##\n ##lang.ticket.impact## : ##ticket.impact##\n ##lang.ticket.priority## : ##ticket.priority##\n##IFticket.user.email## ##lang.ticket.user.email## : ##ticket.user.email ##ENDIFticket.user.email##\n##IFticket.category## ##lang.ticket.category## : ##ticket.category## ##ENDIFticket.category## ##ELSEticket.category## ##lang.ticket.nocategoryassigned## ##ENDELSEticket.category##\n ##lang.ticket.content## : ##ticket.content##\n ##IFticket.storestatus=6##\n\n ##lang.ticket.solvedate## : ##ticket.solvedate##\n ##lang.ticket.solution.type## : ##ticket.solution.type##\n ##lang.ticket.solution.description## : ##ticket.solution.description##\n ##ENDIFticket.storestatus##\n\n##FOREACHtimelineitems##\n[##timelineitems.date##]\n##lang.timelineitems.author## ##timelineitems.author##\n##lang.timelineitems.description## ##timelineitems.description##\n##lang.timelineitems.date## ##timelineitems.date##\n##lang.timelineitems.position## ##timelineitems.position##\n##lang.timelineitems.type## ##timelineitems.type##\n##lang.timelineitems.typename## ##timelineitems.typename##\n##ENDFOREACHtimelineitems##\n\n##lang.ticket.numberoffollowups## : ##ticket.numberoffollowups##\n##lang.ticket.numberoftasks## : ##ticket.numberoftasks##','<!-- description{ color: inherit; background: #ebebeb; border-style: solid;border-color: #8d8d8d; border-width: 0px 1px 1px 0px; }    -->\n<div>##IFticket.storestatus=5##</div>\n<div>##lang.ticket.url## : <a href=\"##ticket.urlapprove##\">##ticket.urlapprove##</a> <strong>&#160;</strong></div>\n<div><strong>##lang.ticket.autoclosewarning##</strong></div>\n<div><span style=\"color: #888888;\"><strong><span style=\"text-decoration: underline;\">##lang.ticket.solvedate##</span></strong></span> : ##ticket.solvedate##<br /><span style=\"text-decoration: underline; color: #888888;\"><strong>##lang.ticket.solution.type##</strong></span> : ##ticket.solution.type##<br /><span style=\"text-decoration: underline; color: #888888;\"><strong>##lang.ticket.solution.description##</strong></span> : ##ticket.solution.description## ##ENDIFticket.storestatus##</div>\n<div>##ELSEticket.storestatus## ##lang.ticket.url## : <a href=\"##ticket.url##\">##ticket.url##</a> ##ENDELSEticket.storestatus##</div>\n<p class=\"description b\"><strong>##lang.ticket.description##</strong></p>\n<p><span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.ticket.title##</span>&#160;:##ticket.title## <br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.ticket.authors##</span>&#160;:##IFticket.authors## ##ticket.authors## ##ENDIFticket.authors##    ##ELSEticket.authors##--##ENDELSEticket.authors## <br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.ticket.creationdate##</span>&#160;:##ticket.creationdate## <br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.ticket.closedate##</span>&#160;:##ticket.closedate## <br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.ticket.requesttype##</span>&#160;:##ticket.requesttype##<br />\n<br /><span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.ticket.item.name##</span>&#160;:\n<p>##FOREACHitems##</p>\n<div class=\"description b\">##IFticket.itemtype## ##ticket.itemtype##&#160;- ##ticket.item.name## ##IFticket.item.model## ##lang.ticket.item.model## : ##ticket.item.model## ##ENDIFticket.item.model## ##IFticket.item.serial## ##lang.ticket.item.serial## : ##ticket.item.serial## ##ENDIFticket.item.serial## ##IFticket.item.otherserial## ##lang.ticket.item.otherserial## : ##ticket.item.otherserial## ##ENDIFticket.item.otherserial## ##ENDIFticket.itemtype## </div><br />\n<p>##ENDFOREACHitems##</p>\n##IFticket.assigntousers## <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.ticket.assigntousers##</span>&#160;: ##ticket.assigntousers## ##ENDIFticket.assigntousers##<br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\">##lang.ticket.status## </span>&#160;: ##ticket.status##<br /> ##IFticket.assigntogroups## <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.ticket.assigntogroups##</span>&#160;: ##ticket.assigntogroups## ##ENDIFticket.assigntogroups##<br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.ticket.urgency##</span>&#160;: ##ticket.urgency##<br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.ticket.impact##</span>&#160;: ##ticket.impact##<br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.ticket.priority##</span>&#160;: ##ticket.priority## <br /> ##IFticket.user.email##<span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.ticket.user.email##</span>&#160;: ##ticket.user.email ##ENDIFticket.user.email##    <br /> ##IFticket.category##<span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\">##lang.ticket.category## </span>&#160;:##ticket.category## ##ENDIFticket.category## ##ELSEticket.category## ##lang.ticket.nocategoryassigned## ##ENDELSEticket.category##    <br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.ticket.content##</span>&#160;: ##ticket.content##</p>\n<br />##IFticket.storestatus=6##<br /><span style=\"text-decoration: underline;\"><strong><span style=\"color: #888888;\">##lang.ticket.solvedate##</span></strong></span> : ##ticket.solvedate##<br /><span style=\"color: #888888;\"><strong><span style=\"text-decoration: underline;\">##lang.ticket.solution.type##</span></strong></span> : ##ticket.solution.type##<br /><span style=\"text-decoration: underline; color: #888888;\"><strong>##lang.ticket.solution.description##</strong></span> : ##ticket.solution.description##<br />##ENDIFticket.storestatus##</p>\n<p>##FOREACHtimelineitems##</p>\n<div class=\"description b\"><br /><strong> [##timelineitems.date##]</strong><br /><span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.timelineitems.author## </span> <span style=\"color: #000000; font-weight: bold; text-decoration: underline;\">##timelineitems.author##</span><br /><span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.timelineitems.description## </span> <span style=\"color: #000000; font-weight: bold; text-decoration: underline;\">##timelineitems.description##</span><br /><span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.timelineitems.date## </span> <span style=\"color: #000000; font-weight: bold; text-decoration: underline;\">##timelineitems.date##</span><br /><span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\">##lang.timelineitems.position## </span><span style=\"color: #000000; font-weight: bold; text-decoration: underline;\"> ##timelineitems.position##</span></div>\n<div class=\"description b\"><span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\">##lang.timelineitems.type## </span><span style=\"color: #000000; font-weight: bold; text-decoration: underline;\"> ##timelineitems.type##</span></div>\n<div class=\"description b\"><span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\">##lang.timelineitems.typename## </span> <span style=\"color: #000000; font-weight: bold; text-decoration: underline;\">##timelineitems.typename##</span></div>\n<p>##ENDFOREACHtimelineitems##</p>\n<div class=\"description b\">##lang.ticket.numberoffollowups##&#160;: ##ticket.numberoffollowups##</div>\n<div class=\"description b\">##lang.ticket.numberoftasks##&#160;: ##ticket.numberoftasks##</div>'),
(5,12,'','##contract.action##  ##contract.entity##','##lang.contract.entity## : ##contract.entity##\n\n##FOREACHcontracts##\n##lang.contract.name## : ##contract.name##\n##lang.contract.number## : ##contract.number##\n##lang.contract.time## : ##contract.time##\n##IFcontract.type####lang.contract.type## : ##contract.type####ENDIFcontract.type##\n##contract.url##\n##ENDFOREACHcontracts##','<p>##lang.contract.entity## : ##contract.entity##<br />\n<br />##FOREACHcontracts##<br />##lang.contract.name## :\n##contract.name##<br />\n##lang.contract.number## : ##contract.number##<br />\n##lang.contract.time## : ##contract.time##<br />\n##IFcontract.type####lang.contract.type## : ##contract.type##\n##ENDIFcontract.type##<br />\n<a href=\"##contract.url##\">\n##contract.url##</a><br />\n##ENDFOREACHcontracts##</p>'),
(6,5,'','##ticket.action## ##ticket.title##','##lang.ticket.url## : ##ticket.url##\n\n##lang.ticket.description##\n\n\n##lang.ticket.title##  :##ticket.title##\n\n##lang.ticket.authors##  :##IFticket.authors##\n##ticket.authors## ##ENDIFticket.authors##\n##ELSEticket.authors##--##ENDELSEticket.authors##\n\n##IFticket.category## ##lang.ticket.category##  :##ticket.category##\n##ENDIFticket.category## ##ELSEticket.category##\n##lang.ticket.nocategoryassigned## ##ENDELSEticket.category##\n\n##lang.ticket.content##  : ##ticket.content##\n##IFticket.itemtype##\n##lang.ticket.item.name##  : ##ticket.itemtype## - ##ticket.item.name##\n##ENDIFticket.itemtype##','<div>##lang.ticket.url## : <a href=\"##ticket.url##\">\n##ticket.url##</a></div>\n<div class=\"description b\">\n##lang.ticket.description##</div>\n<p><span\nstyle=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\">\n##lang.ticket.title##</span>&#160;:##ticket.title##\n<br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\">\n##lang.ticket.authors##</span>\n##IFticket.authors## ##ticket.authors##\n##ENDIFticket.authors##\n##ELSEticket.authors##--##ENDELSEticket.authors##\n<span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\">\n</span><br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> </span>\n##IFticket.category##<span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\">\n##lang.ticket.category## </span>&#160;:##ticket.category##\n##ENDIFticket.category## ##ELSEticket.category##\n##lang.ticket.nocategoryassigned## ##ENDELSEticket.category##\n<br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\">\n##lang.ticket.content##</span>&#160;:\n##ticket.content##<br />##IFticket.itemtype##\n<span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\">\n##lang.ticket.item.name##</span>&#160;:\n##ticket.itemtype## - ##ticket.item.name##\n##ENDIFticket.itemtype##</p>'),
(7,7,'','##ticket.action## ##ticket.title##','##FOREACHvalidations##\n\n##IFvalidation.storestatus=2##\n##validation.submission.title##\n##lang.validation.commentsubmission## : ##validation.commentsubmission##\n##ENDIFvalidation.storestatus##\n##ELSEvalidation.storestatus## ##validation.answer.title## ##ENDELSEvalidation.storestatus##\n\n##lang.ticket.url## : ##ticket.urlvalidation##\n\n##IFvalidation.status## ##lang.validation.status## : ##validation.status## ##ENDIFvalidation.status##\n##IFvalidation.commentvalidation##\n##lang.validation.commentvalidation## : ##validation.commentvalidation##\n##ENDIFvalidation.commentvalidation##\n##ENDFOREACHvalidations##','<div>##FOREACHvalidations##</div>\n<p>##IFvalidation.storestatus=2##</p>\n<div>##validation.submission.title##</div>\n<div>##lang.validation.commentsubmission## : ##validation.commentsubmission##</div>\n<div>##ENDIFvalidation.storestatus##</div>\n<div>##ELSEvalidation.storestatus## ##validation.answer.title## ##ENDELSEvalidation.storestatus##</div>\n<div></div>\n<div>\n<div>##lang.ticket.url## : <a href=\"##ticket.urlvalidation##\"> ##ticket.urlvalidation## </a></div>\n</div>\n<p>##IFvalidation.status## ##lang.validation.status## : ##validation.status## ##ENDIFvalidation.status##\n<br /> ##IFvalidation.commentvalidation##<br /> ##lang.validation.commentvalidation## :\n&#160; ##validation.commentvalidation##<br /> ##ENDIFvalidation.commentvalidation##\n<br />##ENDFOREACHvalidations##</p>'),
(8,6,'','##ticket.action## ##ticket.entity##','##FOREACHtickets##\n##lang.ticket.authors##: ##ticket.authors##\n##lang.ticket.title##: ##ticket.title##\n##lang.ticket.priority##: ##ticket.priority##\n##lang.ticket.status##: ##ticket.status##\n##lang.ticket.attribution##: ##IFticket.assigntousers####ticket.assigntousers##\n##ENDIFticket.assigntousers####IFticket.assigntogroups##\n##ticket.assigntogroups## ##ENDIFticket.assigntogroups####IFticket.assigntosupplier##\n##ticket.assigntosupplier## ##ENDIFticket.assigntosupplier##\n##lang.ticket.creationdate##: ##ticket.creationdate##\n##lang.ticket.content##: ##ticket.content## ##ENDFOREACHtickets##','<table class=\"tab_cadre\" border=\"1\" cellspacing=\"2\" cellpadding=\"3\">\n<tbody>\n<tr>\n<td style=\"text-align: left;\" width=\"auto\" bgcolor=\"#cccccc\"><span style=\"font-size: 11px; text-align: left;\">##lang.ticket.authors##</span></td>\n<td style=\"text-align: left;\" width=\"auto\" bgcolor=\"#cccccc\"><span style=\"font-size: 11px; text-align: left;\">##lang.ticket.title##</span></td>\n<td style=\"text-align: left;\" width=\"auto\" bgcolor=\"#cccccc\"><span style=\"font-size: 11px; text-align: left;\">##lang.ticket.priority##</span></td>\n<td style=\"text-align: left;\" width=\"auto\" bgcolor=\"#cccccc\"><span style=\"font-size: 11px; text-align: left;\">##lang.ticket.status##</span></td>\n<td style=\"text-align: left;\" width=\"auto\" bgcolor=\"#cccccc\"><span style=\"font-size: 11px; text-align: left;\">##lang.ticket.attribution##</span></td>\n<td style=\"text-align: left;\" width=\"auto\" bgcolor=\"#cccccc\"><span style=\"font-size: 11px; text-align: left;\">##lang.ticket.creationdate##</span></td>\n<td style=\"text-align: left;\" width=\"auto\" bgcolor=\"#cccccc\"><span style=\"font-size: 11px; text-align: left;\">##lang.ticket.content##</span>##FOREACHtickets##</td>\n</tr>\n<tr>\n<td width=\"auto\"><span style=\"font-size: 11px; text-align: left;\">##ticket.authors##</span></td>\n<td width=\"auto\"><span style=\"font-size: 11px; text-align: left;\"><a href=\"##ticket.url##\">##ticket.title##</a></span></td>\n<td width=\"auto\"><span style=\"font-size: 11px; text-align: left;\">##ticket.priority##</span></td>\n<td width=\"auto\"><span style=\"font-size: 11px; text-align: left;\">##ticket.status##</span></td>\n<td width=\"auto\"><span style=\"font-size: 11px; text-align: left;\">##IFticket.assigntousers####ticket.assigntousers##<br />##ENDIFticket.assigntousers####IFticket.assigntogroups##<br />##ticket.assigntogroups## ##ENDIFticket.assigntogroups####IFticket.assigntosupplier##<br />##ticket.assigntosupplier## ##ENDIFticket.assigntosupplier##</span></td>\n<td width=\"auto\"><span style=\"font-size: 11px; text-align: left;\">##ticket.creationdate##</span></td>\n<td width=\"auto\"><span style=\"font-size: 11px; text-align: left;\">##ticket.content##</span>##ENDFOREACHtickets##</td>\n</tr>\n</tbody>\n</table>'),
(9,9,'','##consumable.action##  ##consumable.entity##','##lang.consumable.entity## : ##consumable.entity##\n\n\n##FOREACHconsumables##\n##lang.consumable.item## : ##consumable.item##\n\n\n##lang.consumable.reference## : ##consumable.reference##\n\n##lang.consumable.remaining## : ##consumable.remaining##\n##lang.consumable.stock_target## : ##consumable.stock_target##\n##lang.consumable.to_order## : ##consumable.to_order##\n\n##consumable.url##\n\n##ENDFOREACHconsumables##','<p>\n##lang.consumable.entity## : ##consumable.entity##\n<br /> <br />##FOREACHconsumables##\n<br />##lang.consumable.item## : ##consumable.item##<br />\n<br />##lang.consumable.reference## : ##consumable.reference##<br />\n##lang.consumable.remaining## : ##consumable.remaining##<br />\n##lang.consumable.stock_target## : ##consumable.stock_target##<br />\n##lang.consumable.to_order## : ##consumable.to_order##<br />\n<a href=\"##consumable.url##\"> ##consumable.url##</a><br />\n   ##ENDFOREACHconsumables##</p>'),
(10,8,'','##cartridge.action##  ##cartridge.entity##','##lang.cartridge.entity## : ##cartridge.entity##\n\n\n##FOREACHcartridges##\n##lang.cartridge.item## : ##cartridge.item##\n\n\n##lang.cartridge.reference## : ##cartridge.reference##\n\n##lang.cartridge.remaining## : ##cartridge.remaining##\n##lang.cartridge.stock_target## : ##cartridge.stock_target##\n##lang.cartridge.to_order## : ##cartridge.to_order##\n\n##cartridge.url##\n ##ENDFOREACHcartridges##','<p>##lang.cartridge.entity## : ##cartridge.entity##\n<br /> <br />##FOREACHcartridges##\n<br />##lang.cartridge.item## :\n##cartridge.item##<br /> <br />\n##lang.cartridge.reference## :\n##cartridge.reference##<br />\n##lang.cartridge.remaining## :\n##cartridge.remaining##<br />\n##lang.cartridge.stock_target## :\n##cartridge.stock_target##<br />\n##lang.cartridge.to_order## :\n##cartridge.to_order##<br />\n<a href=\"##cartridge.url##\">\n##cartridge.url##</a><br />\n##ENDFOREACHcartridges##</p>'),
(11,10,'','##infocom.action##  ##infocom.entity##','##lang.infocom.entity## : ##infocom.entity##\n\n\n##FOREACHinfocoms##\n\n##lang.infocom.itemtype## : ##infocom.itemtype##\n\n##lang.infocom.item## : ##infocom.item##\n\n\n##lang.infocom.expirationdate## : ##infocom.expirationdate##\n\n##infocom.url##\n ##ENDFOREACHinfocoms##','<p>##lang.infocom.entity## : ##infocom.entity##\n<br /> <br />##FOREACHinfocoms##\n<br />##lang.infocom.itemtype## : ##infocom.itemtype##<br />\n##lang.infocom.item## : ##infocom.item##<br /> <br />\n##lang.infocom.expirationdate## : ##infocom.expirationdate##\n<br /> <a href=\"##infocom.url##\">\n##infocom.url##</a><br />\n##ENDFOREACHinfocoms##</p>'),
(12,11,'','##license.action##  ##license.entity##','##lang.license.entity## : ##license.entity##\n\n##FOREACHlicenses##\n\n##lang.license.item## : ##license.item##\n\n##lang.license.serial## : ##license.serial##\n\n##lang.license.expirationdate## : ##license.expirationdate##\n\n##license.url##\n ##ENDFOREACHlicenses##','<p>\n##lang.license.entity## : ##license.entity##<br />\n##FOREACHlicenses##\n<br />##lang.license.item## : ##license.item##<br />\n##lang.license.serial## : ##license.serial##<br />\n##lang.license.expirationdate## : ##license.expirationdate##\n<br /> <a href=\"##license.url##\"> ##license.url##\n</a><br /> ##ENDFOREACHlicenses##</p>'),
(13,13,'','##user.action##','##user.realname## ##user.firstname##\n\n##lang.passwordforget.information##\n\n##lang.passwordforget.link## ##user.passwordforgeturl##','<p><strong>##user.realname## ##user.firstname##</strong></p>\n<p>##lang.passwordforget.information##</p>\n<p>##lang.passwordforget.link## <a title=\"##user.passwordforgeturl##\" href=\"##user.passwordforgeturl##\">##user.passwordforgeturl##</a></p>'),
(14,14,'','##ticket.action## ##ticket.title##','##lang.ticket.title## : ##ticket.title##\n\n##lang.ticket.closedate## : ##ticket.closedate##\n\n##lang.satisfaction.text## ##ticket.urlsatisfaction##','<p>##lang.ticket.title## : ##ticket.title##</p>\n<p>##lang.ticket.closedate## : ##ticket.closedate##</p>\n<p>##lang.satisfaction.text## <a href=\"##ticket.urlsatisfaction##\">##ticket.urlsatisfaction##</a></p>'),
(15,15,'','##lang.unicity.action##','##lang.unicity.entity## : ##unicity.entity##\n\n##lang.unicity.itemtype## : ##unicity.itemtype##\n\n##lang.unicity.message## : ##unicity.message##\n\n##lang.unicity.action_user## : ##unicity.action_user##\n\n##lang.unicity.action_type## : ##unicity.action_type##\n\n##lang.unicity.date## : ##unicity.date##','<p>##lang.unicity.entity## : ##unicity.entity##</p>\n<p>##lang.unicity.itemtype## : ##unicity.itemtype##</p>\n<p>##lang.unicity.message## : ##unicity.message##</p>\n<p>##lang.unicity.action_user## : ##unicity.action_user##</p>\n<p>##lang.unicity.action_type## : ##unicity.action_type##</p>\n<p>##lang.unicity.date## : ##unicity.date##</p>'),
(16,16,'','##crontask.action##','##lang.crontask.warning##\n\n##FOREACHcrontasks##\n ##crontask.name## : ##crontask.description##\n\n##ENDFOREACHcrontasks##','<p>##lang.crontask.warning##</p>\n<p>##FOREACHcrontasks## <br /><a href=\"##crontask.url##\">##crontask.name##</a> : ##crontask.description##<br /> <br />##ENDFOREACHcrontasks##</p>'),
(17,17,'','##problem.action## ##problem.title##','##IFproblem.storestatus=5##\n ##lang.problem.url## : ##problem.urlapprove##\n ##lang.problem.solvedate## : ##problem.solvedate##\n ##lang.problem.solution.type## : ##problem.solution.type##\n ##lang.problem.solution.description## : ##problem.solution.description## ##ENDIFproblem.storestatus##\n ##ELSEproblem.storestatus## ##lang.problem.url## : ##problem.url## ##ENDELSEproblem.storestatus##\n\n ##lang.problem.description##\n\n ##lang.problem.title##  :##problem.title##\n ##lang.problem.authors##  :##IFproblem.authors## ##problem.authors## ##ENDIFproblem.authors## ##ELSEproblem.authors##--##ENDELSEproblem.authors##\n ##lang.problem.creationdate##  :##problem.creationdate##\n ##IFproblem.assigntousers## ##lang.problem.assigntousers##  : ##problem.assigntousers## ##ENDIFproblem.assigntousers##\n ##lang.problem.status##  : ##problem.status##\n ##IFproblem.assigntogroups## ##lang.problem.assigntogroups##  : ##problem.assigntogroups## ##ENDIFproblem.assigntogroups##\n ##lang.problem.urgency##  : ##problem.urgency##\n ##lang.problem.impact##  : ##problem.impact##\n ##lang.problem.priority## : ##problem.priority##\n##IFproblem.category## ##lang.problem.category##  :##problem.category## ##ENDIFproblem.category## ##ELSEproblem.category## ##lang.problem.nocategoryassigned## ##ENDELSEproblem.category##\n ##lang.problem.content##  : ##problem.content##\n\n##IFproblem.storestatus=6##\n ##lang.problem.solvedate## : ##problem.solvedate##\n ##lang.problem.solution.type## : ##problem.solution.type##\n ##lang.problem.solution.description## : ##problem.solution.description##\n##ENDIFproblem.storestatus##\n ##lang.problem.numberoffollowups## : ##problem.numberoffollowups##\n\n##FOREACHfollowups##\n\n [##followup.date##] ##lang.followup.isprivate## : ##followup.isprivate##\n ##lang.followup.author## ##followup.author##\n ##lang.followup.description## ##followup.description##\n ##lang.followup.date## ##followup.date##\n ##lang.followup.requesttype## ##followup.requesttype##\n\n##ENDFOREACHfollowups##\n ##lang.problem.numberoftickets## : ##problem.numberoftickets##\n\n##FOREACHtickets##\n [##ticket.date##] ##lang.problem.title## : ##ticket.title##\n ##lang.problem.content## ##ticket.content##\n\n##ENDFOREACHtickets##\n ##lang.problem.numberoftasks## : ##problem.numberoftasks##\n\n##FOREACHtasks##\n [##task.date##]\n ##lang.task.author## ##task.author##\n ##lang.task.description## ##task.description##\n ##lang.task.time## ##task.time##\n ##lang.task.category## ##task.category##\n\n##ENDFOREACHtasks##\n','<p>##IFproblem.storestatus=5##</p>\n<div>##lang.problem.url## : <a href=\"##problem.urlapprove##\">##problem.urlapprove##</a></div>\n<div><span style=\"color: #888888;\"><strong><span style=\"text-decoration: underline;\">##lang.problem.solvedate##</span></strong></span> : ##problem.solvedate##<br /><span style=\"text-decoration: underline; color: #888888;\"><strong>##lang.problem.solution.type##</strong></span> : ##problem.solution.type##<br /><span style=\"text-decoration: underline; color: #888888;\"><strong>##lang.problem.solution.description##</strong></span> : ##problem.solution.description## ##ENDIFproblem.storestatus##</div>\n<div>##ELSEproblem.storestatus## ##lang.problem.url## : <a href=\"##problem.url##\">##problem.url##</a> ##ENDELSEproblem.storestatus##</div>\n<p class=\"description b\"><strong>##lang.problem.description##</strong></p>\n<p><span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.problem.title##</span>&#160;:##problem.title## <br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.problem.authors##</span>&#160;:##IFproblem.authors## ##problem.authors## ##ENDIFproblem.authors##    ##ELSEproblem.authors##--##ENDELSEproblem.authors## <br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.problem.creationdate##</span>&#160;:##problem.creationdate## <br /> ##IFproblem.assigntousers## <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.problem.assigntousers##</span>&#160;: ##problem.assigntousers## ##ENDIFproblem.assigntousers##<br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\">##lang.problem.status## </span>&#160;: ##problem.status##<br /> ##IFproblem.assigntogroups## <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.problem.assigntogroups##</span>&#160;: ##problem.assigntogroups## ##ENDIFproblem.assigntogroups##<br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.problem.urgency##</span>&#160;: ##problem.urgency##<br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.problem.impact##</span>&#160;: ##problem.impact##<br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.problem.priority##</span> : ##problem.priority## <br />##IFproblem.category##<span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\">##lang.problem.category## </span>&#160;:##problem.category##  ##ENDIFproblem.category## ##ELSEproblem.category##  ##lang.problem.nocategoryassigned## ##ENDELSEproblem.category##    <br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.problem.content##</span>&#160;: ##problem.content##</p>\n<p>##IFproblem.storestatus=6##<br /><span style=\"text-decoration: underline;\"><strong><span style=\"color: #888888;\">##lang.problem.solvedate##</span></strong></span> : ##problem.solvedate##<br /><span style=\"color: #888888;\"><strong><span style=\"text-decoration: underline;\">##lang.problem.solution.type##</span></strong></span> : ##problem.solution.type##<br /><span style=\"text-decoration: underline; color: #888888;\"><strong>##lang.problem.solution.description##</strong></span> : ##problem.solution.description##<br />##ENDIFproblem.storestatus##</p>\n<div class=\"description b\">##lang.problem.numberoffollowups##&#160;: ##problem.numberoffollowups##</div>\n<p>##FOREACHfollowups##</p>\n<div class=\"description b\"><br /> <strong> [##followup.date##] <em>##lang.followup.isprivate## : ##followup.isprivate## </em></strong><br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.followup.author## </span> ##followup.author##<br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.followup.description## </span> ##followup.description##<br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.followup.date## </span> ##followup.date##<br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.followup.requesttype## </span> ##followup.requesttype##</div>\n<p>##ENDFOREACHfollowups##</p>\n<div class=\"description b\">##lang.problem.numberoftickets##&#160;: ##problem.numberoftickets##</div>\n<p>##FOREACHtickets##</p>\n<div><strong> [##ticket.date##] <em>##lang.problem.title## : <a href=\"##ticket.url##\">##ticket.title## </a></em></strong><br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> </span><span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\">##lang.problem.content## </span> ##ticket.content##\n<p>##ENDFOREACHtickets##</p>\n<div class=\"description b\">##lang.problem.numberoftasks##&#160;: ##problem.numberoftasks##</div>\n<p>##FOREACHtasks##</p>\n<div class=\"description b\"><strong>[##task.date##] </strong><br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.task.author##</span> ##task.author##<br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.task.description##</span> ##task.description##<br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.task.time##</span> ##task.time##<br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.task.category##</span> ##task.category##</div>\n<p>##ENDFOREACHtasks##</p>\n</div>'),
(18,18,'','##recall.action##: ##recall.item.name##','##recall.action##: ##recall.item.name##\n\n##recall.item.content##\n\n##lang.recall.planning.begin##: ##recall.planning.begin##\n##lang.recall.planning.end##: ##recall.planning.end##\n##lang.recall.planning.state##: ##recall.planning.state##\n##lang.recall.item.private##: ##recall.item.private##','<p>##recall.action##: <a href=\"##recall.item.url##\">##recall.item.name##</a></p>\n<p>##recall.item.content##</p>\n<p>##lang.recall.planning.begin##: ##recall.planning.begin##<br />##lang.recall.planning.end##: ##recall.planning.end##<br />##lang.recall.planning.state##: ##recall.planning.state##<br />##lang.recall.item.private##: ##recall.item.private##<br /><br /></p>\n<p><br /><br /></p>'),
(19,19,'','##change.action## ##change.title##','##IFchange.storestatus=5##\n ##lang.change.url## : ##change.urlapprove##\n ##lang.change.solvedate## : ##change.solvedate##\n ##lang.change.solution.type## : ##change.solution.type##\n ##lang.change.solution.description## : ##change.solution.description## ##ENDIFchange.storestatus##\n ##ELSEchange.storestatus## ##lang.change.url## : ##change.url## ##ENDELSEchange.storestatus##\n\n ##lang.change.description##\n\n ##lang.change.title##  :##change.title##\n ##lang.change.authors##  :##IFchange.authors## ##change.authors## ##ENDIFchange.authors## ##ELSEchange.authors##--##ENDELSEchange.authors##\n ##lang.change.creationdate##  :##change.creationdate##\n ##IFchange.assigntousers## ##lang.change.assigntousers##  : ##change.assigntousers## ##ENDIFchange.assigntousers##\n ##lang.change.status##  : ##change.status##\n ##IFchange.assigntogroups## ##lang.change.assigntogroups##  : ##change.assigntogroups## ##ENDIFchange.assigntogroups##\n ##lang.change.urgency##  : ##change.urgency##\n ##lang.change.impact##  : ##change.impact##\n ##lang.change.priority## : ##change.priority##\n##IFchange.category## ##lang.change.category##  :##change.category## ##ENDIFchange.category## ##ELSEchange.category## ##lang.change.nocategoryassigned## ##ENDELSEchange.category##\n ##lang.change.content##  : ##change.content##\n\n##IFchange.storestatus=6##\n ##lang.change.solvedate## : ##change.solvedate##\n ##lang.change.solution.type## : ##change.solution.type##\n ##lang.change.solution.description## : ##change.solution.description##\n##ENDIFchange.storestatus##\n ##lang.change.numberoffollowups## : ##change.numberoffollowups##\n\n##FOREACHfollowups##\n\n [##followup.date##] ##lang.followup.isprivate## : ##followup.isprivate##\n ##lang.followup.author## ##followup.author##\n ##lang.followup.description## ##followup.description##\n ##lang.followup.date## ##followup.date##\n ##lang.followup.requesttype## ##followup.requesttype##\n\n##ENDFOREACHfollowups##\n ##lang.change.numberofproblems## : ##change.numberofproblems##\n\n##FOREACHproblems##\n [##problem.date##] ##lang.change.title## : ##problem.title##\n ##lang.change.content## ##problem.content##\n\n##ENDFOREACHproblems##\n ##lang.change.numberoftasks## : ##change.numberoftasks##\n\n##FOREACHtasks##\n [##task.date##]\n ##lang.task.author## ##task.author##\n ##lang.task.description## ##task.description##\n ##lang.task.time## ##task.time##\n ##lang.task.category## ##task.category##\n\n##ENDFOREACHtasks##\n','<p>##IFchange.storestatus=5##</p>\n<div>##lang.change.url## : <a href=\"##change.urlapprove##\">##change.urlapprove##</a></div>\n<div><span style=\"color: #888888;\"><strong><span style=\"text-decoration: underline;\">##lang.change.solvedate##</span></strong></span> : ##change.solvedate##<br /><span style=\"text-decoration: underline; color: #888888;\"><strong>##lang.change.solution.type##</strong></span> : ##change.solution.type##<br /><span style=\"text-decoration: underline; color: #888888;\"><strong>##lang.change.solution.description##</strong></span> : ##change.solution.description## ##ENDIFchange.storestatus##</div>\n<div>##ELSEchange.storestatus## ##lang.change.url## : <a href=\"##change.url##\">##change.url##</a> ##ENDELSEchange.storestatus##</div>\n<p class=\"description b\"><strong>##lang.change.description##</strong></p>\n<p><span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.change.title##</span>&#160;:##change.title## <br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.change.authors##</span>&#160;:##IFchange.authors## ##change.authors## ##ENDIFchange.authors##    ##ELSEchange.authors##--##ENDELSEchange.authors## <br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.change.creationdate##</span>&#160;:##change.creationdate## <br /> ##IFchange.assigntousers## <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.change.assigntousers##</span>&#160;: ##change.assigntousers## ##ENDIFchange.assigntousers##<br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\">##lang.change.status## </span>&#160;: ##change.status##<br /> ##IFchange.assigntogroups## <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.change.assigntogroups##</span>&#160;: ##change.assigntogroups## ##ENDIFchange.assigntogroups##<br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.change.urgency##</span>&#160;: ##change.urgency##<br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.change.impact##</span>&#160;: ##change.impact##<br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.change.priority##</span> : ##change.priority## <br />##IFchange.category##<span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\">##lang.change.category## </span>&#160;:##change.category##  ##ENDIFchange.category## ##ELSEchange.category##  ##lang.change.nocategoryassigned## ##ENDELSEchange.category##    <br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.change.content##</span>&#160;: ##change.content##</p>\n<p>##IFchange.storestatus=6##<br /><span style=\"text-decoration: underline;\"><strong><span style=\"color: #888888;\">##lang.change.solvedate##</span></strong></span> : ##change.solvedate##<br /><span style=\"color: #888888;\"><strong><span style=\"text-decoration: underline;\">##lang.change.solution.type##</span></strong></span> : ##change.solution.type##<br /><span style=\"text-decoration: underline; color: #888888;\"><strong>##lang.change.solution.description##</strong></span> : ##change.solution.description##<br />##ENDIFchange.storestatus##</p>\n<div class=\"description b\">##lang.change.numberoffollowups##&#160;: ##change.numberoffollowups##</div>\n<p>##FOREACHfollowups##</p>\n<div class=\"description b\"><br /> <strong> [##followup.date##] <em>##lang.followup.isprivate## : ##followup.isprivate## </em></strong><br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.followup.author## </span> ##followup.author##<br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.followup.description## </span> ##followup.description##<br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.followup.date## </span> ##followup.date##<br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.followup.requesttype## </span> ##followup.requesttype##</div>\n<p>##ENDFOREACHfollowups##</p>\n<div class=\"description b\">##lang.change.numberofproblems##&#160;: ##change.numberofproblems##</div>\n<p>##FOREACHproblems##</p>\n<div><strong> [##problem.date##] <em>##lang.change.title## : <a href=\"##problem.url##\">##problem.title## </a></em></strong><br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> </span><span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\">##lang.change.content## </span> ##problem.content##\n<p>##ENDFOREACHproblems##</p>\n<div class=\"description b\">##lang.change.numberoftasks##&#160;: ##change.numberoftasks##</div>\n<p>##FOREACHtasks##</p>\n<div class=\"description b\"><strong>[##task.date##] </strong><br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.task.author##</span> ##task.author##<br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.task.description##</span> ##task.description##<br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.task.time##</span> ##task.time##<br /> <span style=\"color: #8b8c8f; font-weight: bold; text-decoration: underline;\"> ##lang.task.category##</span> ##task.category##</div>\n<p>##ENDFOREACHtasks##</p>\n</div>'),
(20,20,'','##mailcollector.action##','##FOREACHmailcollectors##\n##lang.mailcollector.name## : ##mailcollector.name##\n##lang.mailcollector.errors## : ##mailcollector.errors##\n##mailcollector.url##\n##ENDFOREACHmailcollectors##','<p>##FOREACHmailcollectors##<br />##lang.mailcollector.name## : ##mailcollector.name##<br /> ##lang.mailcollector.errors## : ##mailcollector.errors##<br /><a href=\"##mailcollector.url##\">##mailcollector.url##</a><br /> ##ENDFOREACHmailcollectors##</p>\n<p></p>'),
(21,21,'','##project.action## ##project.name## ##project.code##','##lang.project.url## : ##project.url##\n\n##lang.project.description##\n\n##lang.project.name## : ##project.name##\n##lang.project.code## : ##project.code##\n##lang.project.manager## : ##project.manager##\n##lang.project.managergroup## : ##project.managergroup##\n##lang.project.creationdate## : ##project.creationdate##\n##lang.project.priority## : ##project.priority##\n##lang.project.state## : ##project.state##\n##lang.project.type## : ##project.type##\n##lang.project.description## : ##project.description##\n\n##lang.project.numberoftasks## : ##project.numberoftasks##\n\n\n\n##FOREACHtasks##\n\n[##task.creationdate##]\n##lang.task.name## : ##task.name##\n##lang.task.state## : ##task.state##\n##lang.task.type## : ##task.type##\n##lang.task.percent## : ##task.percent##\n##lang.task.description## : ##task.description##\n\n##ENDFOREACHtasks##','<p>##lang.project.url## : <a href=\"##project.url##\">##project.url##</a></p>\n<p><strong>##lang.project.description##</strong></p>\n<p>##lang.project.name## : ##project.name##<br />##lang.project.code## : ##project.code##<br /> ##lang.project.manager## : ##project.manager##<br />##lang.project.managergroup## : ##project.managergroup##<br /> ##lang.project.creationdate## : ##project.creationdate##<br />##lang.project.priority## : ##project.priority## <br />##lang.project.state## : ##project.state##<br />##lang.project.type## : ##project.type##<br />##lang.project.description## : ##project.description##</p>\n<p>##lang.project.numberoftasks## : ##project.numberoftasks##</p>\n<div>\n<p>##FOREACHtasks##</p>\n<div><strong>[##task.creationdate##] </strong><br /> ##lang.task.name## : ##task.name##<br />##lang.task.state## : ##task.state##<br />##lang.task.type## : ##task.type##<br />##lang.task.percent## : ##task.percent##<br />##lang.task.description## : ##task.description##</div>\n<p>##ENDFOREACHtasks##</p>\n</div>'),
(22,22,'','##projecttask.action## ##projecttask.name##','##lang.projecttask.url## : ##projecttask.url##\n\n##lang.projecttask.description##\n\n##lang.projecttask.name## : ##projecttask.name##\n##lang.projecttask.project## : ##projecttask.project##\n##lang.projecttask.creationdate## : ##projecttask.creationdate##\n##lang.projecttask.state## : ##projecttask.state##\n##lang.projecttask.type## : ##projecttask.type##\n##lang.projecttask.description## : ##projecttask.description##\n\n##lang.projecttask.numberoftasks## : ##projecttask.numberoftasks##\n\n\n\n##FOREACHtasks##\n\n[##task.creationdate##]\n##lang.task.name## : ##task.name##\n##lang.task.state## : ##task.state##\n##lang.task.type## : ##task.type##\n##lang.task.percent## : ##task.percent##\n##lang.task.description## : ##task.description##\n\n##ENDFOREACHtasks##','<p>##lang.projecttask.url## : <a href=\"##projecttask.url##\">##projecttask.url##</a></p>\n<p><strong>##lang.projecttask.description##</strong></p>\n<p>##lang.projecttask.name## : ##projecttask.name##<br />##lang.projecttask.project## : <a href=\"##projecttask.projecturl##\">##projecttask.project##</a><br />##lang.projecttask.creationdate## : ##projecttask.creationdate##<br />##lang.projecttask.state## : ##projecttask.state##<br />##lang.projecttask.type## : ##projecttask.type##<br />##lang.projecttask.description## : ##projecttask.description##</p>\n<p>##lang.projecttask.numberoftasks## : ##projecttask.numberoftasks##</p>\n<div>\n<p>##FOREACHtasks##</p>\n<div><strong>[##task.creationdate##] </strong><br />##lang.task.name## : ##task.name##<br />##lang.task.state## : ##task.state##<br />##lang.task.type## : ##task.type##<br />##lang.task.percent## : ##task.percent##<br />##lang.task.description## : ##task.description##</div>\n<p>##ENDFOREACHtasks##</p>\n</div>'),
(23,23,'','##objectlock.action##','##objectlock.type## ###objectlock.id## - ##objectlock.name##\n\n      ##lang.objectlock.url##\n      ##objectlock.url##\n\n      ##lang.objectlock.date_mod##\n      ##objectlock.date_mod##\n\n      Hello ##objectlock.lockedby.firstname##,\n      Could go to this item and unlock it for me?\n      Thank you,\n      Regards,\n      ##objectlock.requester.firstname##','<table>\n      <tbody>\n      <tr><th colspan=\"2\"><a href=\"##objectlock.url##\">##objectlock.type## ###objectlock.id## - ##objectlock.name##</a></th></tr>\n      <tr>\n      <td>##lang.objectlock.url##</td>\n      <td>##objectlock.url##</td>\n      </tr>\n      <tr>\n      <td>##lang.objectlock.date_mod##</td>\n      <td>##objectlock.date_mod##</td>\n      </tr>\n      </tbody>\n      </table>\n      <p><span style=\"font-size: small;\">Hello ##objectlock.lockedby.firstname##,<br />Could go to this item and unlock it for me?<br />Thank you,<br />Regards,<br />##objectlock.requester.firstname## ##objectlock.requester.lastname##</span></p>'),
(24,24,'','##savedsearch.action## ##savedsearch.name##','##savedsearch.type## ###savedsearch.id## - ##savedsearch.name##\n\n      ##savedsearch.message##\n\n      ##lang.savedsearch.url##\n      ##savedsearch.url##\n\n      Regards,','<table>\n      <tbody>\n      <tr><th colspan=\"2\"><a href=\"##savedsearch.url##\">##savedsearch.type## ###savedsearch.id## - ##savedsearch.name##</a></th></tr>\n      <tr><td colspan=\"2\"><a href=\"##savedsearch.url##\">##savedsearch.message##</a></td></tr>\n      <tr>\n      <td>##lang.savedsearch.url##</td>\n      <td>##savedsearch.url##</td>\n      </tr>\n      </tbody>\n      </table>\n      <p><span style=\"font-size: small;\">Hello <br />Regards,</span></p>'),
(25,25,'','##certificate.action##  ##certificate.name##','##lang.certificate.entity## : ##certificate.entity##\n\n##lang.certificate.serial## : ##certificate.serial##\n\n##lang.certificate.expirationdate## : ##certificate.expirationdate##\n\n##certificate.url##','<p>\n##lang.certificate.entity## : ##certificate.entity##<br />\n<br />##lang.certificate.name## : ##certificate.name##<br />\n##lang.certificate.serial## : ##certificate.serial##<br />\n##lang.certificate.expirationdate## : ##certificate.expirationdate##\n<br /> <a href=\"##certificate.url##\"> ##certificate.url##\n</a><br />\n</p>'),
(26,26,'','##domain.action## : ##domain.name##','##lang.domain.entity## :##domain.entity##\n   ##lang.domain.name## : ##domain.name## - ##lang.domain.dateexpiration## : ##domain.dateexpiration##','<p>##lang.domain.entity## :##domain.entity##<br /> <br />\n                        ##lang.domain.name##  : ##domain.name## - ##lang.domain.dateexpiration## :  ##domain.dateexpiration##<br />\n                        </p>'),
(27,27,'','##user.action##','##user.realname## ##user.firstname##,\n\n##IFuser.password.has_expired=1##\n##lang.password.has_expired.information##\n##ENDIFuser.password.has_expired##\n##ELSEuser.password.has_expired##\n##lang.password.expires_soon.information##\n##ENDELSEuser.password.has_expired##\n##lang.user.password.expiration.date##: ##user.password.expiration.date##\n##IFuser.account.lock.date##\n##lang.user.account.lock.date##: ##user.account.lock.date##\n##ENDIFuser.account.lock.date##\n\n##password.update.link## ##user.password.update.url##','<p><strong>##user.realname## ##user.firstname##</strong></p>\n\n##IFuser.password.has_expired=1##\n<p>##lang.password.has_expired.information##</p>\n##ENDIFuser.password.has_expired##\n##ELSEuser.password.has_expired##\n<p>##lang.password.expires_soon.information##</p>\n##ENDELSEuser.password.has_expired##\n<p>##lang.user.password.expiration.date##: ##user.password.expiration.date##</p>\n##IFuser.account.lock.date##\n<p>##lang.user.account.lock.date##: ##user.account.lock.date##</p>\n##ENDIFuser.account.lock.date##\n\n<p>##lang.password.update.link## <a href=\"##user.password.update.url##\">##user.password.update.url##</a></p>'),
(28,28,'','##lang.plugins_updates_available##','##lang.plugins_updates_available##\n\n##FOREACHplugins##\n##plugin.name## :##plugin.old_version## -> ##plugin.version##\n##ENDFOREACHplugins##\n\n##lang.marketplace.url## : ##marketplace.url##','<p>##lang.plugins_updates_available##</p>\n<ul>##FOREACHplugins##\n<li>##plugin.name## :##plugin.old_version## -> ##plugin.version##</li>\n##ENDFOREACHplugins##</ul>\n<p>##lang.marketplace.url## : <a title=\"##lang.marketplace.url##\" href=\"##marketplace.url##\" target=\"_blank\" rel=\"noopener\">##marketplace.url##</a></p>'),
(29,29,'','##user.action##','##user.realname## ##user.firstname##\n\n##lang.passwordinit.information##\n\n##lang.passwordinit.link## ##user.passwordiniturl##','<p><strong>##user.realname## ##user.firstname##</strong></p>\n<p>##lang.passwordinit.information##</p>\n<p>##lang.passwordinit.link## <a title=\"##user.passwordiniturl##\" href=\"##user.passwordiniturl##\">##user.passwordiniturl##</a></p>'),
(30,30,'','##change.action## ##change.title##','##lang.change.title## : ##change.title##\n##lang.change.closedate## : ##change.closedate##\n##lang.satisfaction.text## ##change.urlsatisfaction##','<p>##lang.change.title## : ##change.title##</p>\n<p>##lang.change.closedate## : ##change.closedate##</p>\n<p>##lang.satisfaction.text## <a href=\"##change.urlsatisfaction##\">##change.urlsatisfaction##</a></p>'),
(31,31,'','##ticket.action## ##ticket.name##','##lang.ticket.title##: ##ticket.title##\n\n##lang.ticket.reminder.bumpcounter##: ##ticket.reminder.bumpcounter##\n##lang.ticket.reminder.bumpremaining##: ##ticket.reminder.bumpremaining##\n##lang.ticket.reminder.bumptotal##: ##ticket.reminder.bumptotal##\n##lang.ticket.reminder.deadline##: ##ticket.reminder.deadline##\n\n##lang.ticket.reminder.text##: ##ticket.reminder.text##','<p>##lang.ticket.title##: ##ticket.title##</p>\n                    <p>##lang.ticket.reminder.bumpcounter##: ##ticket.reminder.bumpcounter##</a><br />\n                    ##lang.ticket.reminder.bumpremaining##: ##ticket.reminder.bumpremaining##</a><br />\n                    ##lang.ticket.reminder.bumptotal##: ##ticket.reminder.bumptotal##</a><br />\n                    ##lang.ticket.reminder.deadline##: ##ticket.reminder.deadline##</p>\n                    <p>##lang.ticket.reminder.text##: ##ticket.reminder.text##</p>'),
(32,32,'','##knowbaseitem.action## - ##knowbaseitem.subject##','##lang.knowbaseitem.url## : ##knowbaseitem.url##\n\n##lang.knowbaseitem.subject## : ##knowbaseitem.subject##\n\n##lang.knowbaseitem.content## : ##knowbaseitem.content##\n\n##lang.knowbaseitem.categories## : ##knowbaseitem.categories##\n##lang.knowbaseitem.is_faq## ##knowbaseitem.is_faq##\n##lang.knowbaseitem.begin_date## : ##knowbaseitem.begin_date##\n##lang.knowbaseitem.end_date## : ##knowbaseitem.end_date##\n\n##lang.knowbaseitem.numberofdocuments## : ##knowbaseitem.numberofdocuments##\n\n##FOREACHdocuments##\n  ##lang.document.downloadurl## : ##document.downloadurl##\n  ##lang.document.filename## : ##document.filename##\n  ##lang.document.heading## : ##document.heading##\n  ##lang.document.id## : ##document.id##\n  ##lang.document.name## : ##document.name##\n  ##lang.document.url## : ##document.url##\n  ##lang.document.weblink## : ##document.weblink##\n##ENDFOREACHdocuments##\n\n##FOREACHtargets##\n  ##lang.target.itemtype## : ##target.type##\n  ##lang.target.name## : ##target.name##\n  ##lang.target.url## : ##target.url##\n##ENDFOREACHtargets##','<p>##lang.knowbaseitem.subject## : ##knowbaseitem.subject##\n<br>##lang.knowbaseitem.categories## : ##knowbaseitem.categories##\n<br>##lang.knowbaseitem.is_faq## ##knowbaseitem.is_faq##\n<br>##lang.knowbaseitem.begin_date## : ##knowbaseitem.begin_date##\n<br>##lang.knowbaseitem.end_date## : ##knowbaseitem.end_date##\n<br>##lang.knowbaseitem.numberofdocuments## : ##knowbaseitem.numberofdocuments##</p>\n##FOREACHdocuments## <p>##lang.document.downloadurl## : ##document.downloadurl##</p>\n<p>##lang.document.filename## : ##document.filename##</p>\n<p>##lang.document.heading## : ##document.heading##</p>\n<p>##lang.document.id## : ##document.id##</p>\n<p>##lang.document.name## : ##document.name##</p>\n<p>##lang.document.url## : ##document.url##</p>\n<p>##lang.document.weblink## : ##document.weblink##</p> ##ENDFOREACHdocuments##</p>\n##FOREACHtargets## <p>##lang.target.itemtype## : ##target.type##</p>\n<p>##lang.target.name## : ##target.name##</p>\n<p>##lang.target.url## : ##target.url##</p> ##ENDFOREACHtargets##');
/*!40000 ALTER TABLE `glpi_notificationtemplatetranslations` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_notimportedemails`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_notimportedemails` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `from` varchar(255) NOT NULL,
  `to` varchar(255) NOT NULL,
  `mailcollectors_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date` timestamp NOT NULL DEFAULT current_timestamp(),
  `subject` text DEFAULT NULL,
  `messageid` varchar(1000) NOT NULL,
  `reason` int(11) NOT NULL DEFAULT 0,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `users_id` (`users_id`),
  KEY `mailcollectors_id` (`mailcollectors_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_notimportedemails` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_notimportedemails` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_oauth_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_oauth_access_tokens` (
  `identifier` varchar(255) NOT NULL,
  `client` varchar(255) NOT NULL,
  `date_expiration` timestamp NOT NULL,
  `user_identifier` varchar(255) DEFAULT NULL,
  `scopes` text DEFAULT NULL,
  PRIMARY KEY (`identifier`),
  KEY `client` (`client`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_oauth_access_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_oauth_access_tokens` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_oauth_auth_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_oauth_auth_codes` (
  `identifier` varchar(255) NOT NULL,
  `client` varchar(255) NOT NULL,
  `date_expiration` timestamp NOT NULL,
  `user_identifier` varchar(255) DEFAULT NULL,
  `scopes` text DEFAULT NULL,
  PRIMARY KEY (`identifier`),
  KEY `client` (`client`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_oauth_auth_codes` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_oauth_auth_codes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_oauth_refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_oauth_refresh_tokens` (
  `identifier` varchar(255) NOT NULL,
  `access_token` varchar(255) NOT NULL,
  `date_expiration` timestamp NOT NULL,
  PRIMARY KEY (`identifier`),
  KEY `access_token` (`access_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_oauth_refresh_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_oauth_refresh_tokens` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_oauthclients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_oauthclients` (
  `identifier` varchar(255) NOT NULL,
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Internal GLPI ID',
  `name` varchar(255) NOT NULL DEFAULT '',
  `comment` text DEFAULT NULL,
  `secret` varchar(255) NOT NULL,
  `redirect_uri` text NOT NULL,
  `grants` text NOT NULL,
  `scopes` text NOT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT 1,
  `is_confidential` tinyint(4) NOT NULL DEFAULT 1,
  `allowed_ips` text DEFAULT NULL,
  PRIMARY KEY (`identifier`),
  KEY `id` (`id`),
  KEY `name` (`name`),
  KEY `is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_oauthclients` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_oauthclients` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_objectlocks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_objectlocks` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `itemtype` varchar(100) NOT NULL,
  `items_id` int(10) unsigned NOT NULL,
  `users_id` int(10) unsigned NOT NULL,
  `date` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `item` (`itemtype`,`items_id`),
  KEY `users_id` (`users_id`),
  KEY `date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_objectlocks` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_objectlocks` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_olalevelactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_olalevelactions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `olalevels_id` int(10) unsigned NOT NULL DEFAULT 0,
  `action_type` varchar(255) DEFAULT NULL,
  `field` varchar(255) DEFAULT NULL,
  `value` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `olalevels_id` (`olalevels_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_olalevelactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_olalevelactions` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_olalevelcriterias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_olalevelcriterias` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `olalevels_id` int(10) unsigned NOT NULL DEFAULT 0,
  `criteria` varchar(255) DEFAULT NULL,
  `condition` int(11) NOT NULL DEFAULT 0,
  `pattern` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `olalevels_id` (`olalevels_id`),
  KEY `condition` (`condition`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_olalevelcriterias` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_olalevelcriterias` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_olalevels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_olalevels` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `olas_id` int(10) unsigned NOT NULL DEFAULT 0,
  `execution_time` int(11) NOT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT 1,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `match` char(10) DEFAULT NULL,
  `uuid` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `is_active` (`is_active`),
  KEY `olas_id` (`olas_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_olalevels` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_olalevels` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_olalevels_tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_olalevels_tickets` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tickets_id` int(10) unsigned NOT NULL DEFAULT 0,
  `olalevels_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`tickets_id`,`olalevels_id`),
  KEY `olalevels_id` (`olalevels_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_olalevels_tickets` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_olalevels_tickets` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_olas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_olas` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `type` int(11) NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `number_time` int(11) NOT NULL,
  `use_ticket_calendar` tinyint(4) NOT NULL DEFAULT 0,
  `calendars_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `definition_time` varchar(255) DEFAULT NULL,
  `end_of_working_day` tinyint(4) NOT NULL DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT NULL,
  `slms_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `calendars_id` (`calendars_id`),
  KEY `slms_id` (`slms_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_olas` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_olas` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_operatingsystemarchitectures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_operatingsystemarchitectures` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_operatingsystemarchitectures` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_operatingsystemarchitectures` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_operatingsystemeditions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_operatingsystemeditions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_creation` (`date_creation`),
  KEY `date_mod` (`date_mod`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_operatingsystemeditions` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_operatingsystemeditions` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_operatingsystemkernels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_operatingsystemkernels` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_creation` (`date_creation`),
  KEY `date_mod` (`date_mod`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_operatingsystemkernels` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_operatingsystemkernels` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_operatingsystemkernelversions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_operatingsystemkernelversions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `operatingsystemkernels_id` int(10) unsigned NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `operatingsystemkernels_id` (`operatingsystemkernels_id`),
  KEY `date_creation` (`date_creation`),
  KEY `date_mod` (`date_mod`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_operatingsystemkernelversions` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_operatingsystemkernelversions` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_operatingsystems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_operatingsystems` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_operatingsystems` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_operatingsystems` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_operatingsystemservicepacks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_operatingsystemservicepacks` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_operatingsystemservicepacks` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_operatingsystemservicepacks` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_operatingsystemversions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_operatingsystemversions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_operatingsystemversions` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_operatingsystemversions` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_passivedcequipmentmodels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_passivedcequipmentmodels` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `product_number` varchar(255) DEFAULT NULL,
  `weight` int(11) NOT NULL DEFAULT 0,
  `required_units` int(11) NOT NULL DEFAULT 1,
  `depth` float NOT NULL DEFAULT 1,
  `power_connections` int(11) NOT NULL DEFAULT 0,
  `power_consumption` int(11) NOT NULL DEFAULT 0,
  `is_half_rack` tinyint(4) NOT NULL DEFAULT 0,
  `picture_front` text DEFAULT NULL,
  `picture_rear` text DEFAULT NULL,
  `pictures` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `product_number` (`product_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_passivedcequipmentmodels` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_passivedcequipmentmodels` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_passivedcequipments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_passivedcequipments` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `serial` varchar(255) DEFAULT NULL,
  `otherserial` varchar(255) DEFAULT NULL,
  `passivedcequipmentmodels_id` int(10) unsigned DEFAULT NULL,
  `passivedcequipmenttypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id_tech` int(10) unsigned NOT NULL DEFAULT 0,
  `is_template` tinyint(4) NOT NULL DEFAULT 0,
  `template_name` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `states_id` int(10) unsigned NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `manufacturers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `locations_id` (`locations_id`),
  KEY `passivedcequipmentmodels_id` (`passivedcequipmentmodels_id`),
  KEY `passivedcequipmenttypes_id` (`passivedcequipmenttypes_id`),
  KEY `users_id` (`users_id`),
  KEY `users_id_tech` (`users_id_tech`),
  KEY `is_template` (`is_template`),
  KEY `active_assets` (`is_deleted`,`is_template`),
  KEY `states_id` (`states_id`),
  KEY `manufacturers_id` (`manufacturers_id`),
  KEY `date_creation` (`date_creation`),
  KEY `date_mod` (`date_mod`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_passivedcequipments` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_passivedcequipments` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_passivedcequipmenttypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_passivedcequipmenttypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_passivedcequipmenttypes` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_passivedcequipmenttypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_pcivendors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_pcivendors` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `vendorid` varchar(4) NOT NULL,
  `deviceid` varchar(4) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`vendorid`,`deviceid`),
  KEY `deviceid` (`deviceid`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_pcivendors` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_pcivendors` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_pdumodels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_pdumodels` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `product_number` varchar(255) DEFAULT NULL,
  `weight` int(11) NOT NULL DEFAULT 0,
  `required_units` int(11) NOT NULL DEFAULT 1,
  `depth` float NOT NULL DEFAULT 1,
  `power_connections` int(11) NOT NULL DEFAULT 0,
  `max_power` int(11) NOT NULL DEFAULT 0,
  `is_half_rack` tinyint(4) NOT NULL DEFAULT 0,
  `picture_front` text DEFAULT NULL,
  `picture_rear` text DEFAULT NULL,
  `pictures` text DEFAULT NULL,
  `is_rackable` tinyint(4) NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `is_rackable` (`is_rackable`),
  KEY `product_number` (`product_number`),
  KEY `date_creation` (`date_creation`),
  KEY `date_mod` (`date_mod`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_pdumodels` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_pdumodels` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_pdus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_pdus` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `serial` varchar(255) DEFAULT NULL,
  `otherserial` varchar(255) DEFAULT NULL,
  `pdumodels_id` int(10) unsigned DEFAULT NULL,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id_tech` int(10) unsigned NOT NULL DEFAULT 0,
  `is_template` tinyint(4) NOT NULL DEFAULT 0,
  `template_name` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `states_id` int(10) unsigned NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `manufacturers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `pdutypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `locations_id` (`locations_id`),
  KEY `pdumodels_id` (`pdumodels_id`),
  KEY `users_id` (`users_id`),
  KEY `users_id_tech` (`users_id_tech`),
  KEY `is_template` (`is_template`),
  KEY `active_assets` (`is_deleted`,`is_template`),
  KEY `states_id` (`states_id`),
  KEY `manufacturers_id` (`manufacturers_id`),
  KEY `pdutypes_id` (`pdutypes_id`),
  KEY `date_creation` (`date_creation`),
  KEY `date_mod` (`date_mod`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_pdus` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_pdus` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_pdus_racks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_pdus_racks` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `racks_id` int(10) unsigned NOT NULL DEFAULT 0,
  `pdus_id` int(10) unsigned NOT NULL DEFAULT 0,
  `side` int(11) DEFAULT 0,
  `position` int(11) NOT NULL,
  `bgcolor` varchar(7) DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `racks_id` (`racks_id`),
  KEY `pdus_id` (`pdus_id`),
  KEY `date_creation` (`date_creation`),
  KEY `date_mod` (`date_mod`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_pdus_racks` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_pdus_racks` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_pdutypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_pdutypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `name` (`name`),
  KEY `date_creation` (`date_creation`),
  KEY `date_mod` (`date_mod`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_pdutypes` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_pdutypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_pendingreasons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_pendingreasons` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `is_default` tinyint(4) NOT NULL DEFAULT 0,
  `is_pending_per_default` tinyint(4) NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `followup_frequency` int(11) NOT NULL DEFAULT 0,
  `followups_before_resolution` int(11) NOT NULL DEFAULT 0,
  `itilfollowuptemplates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `solutiontemplates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `calendars_id` int(10) unsigned NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `itilfollowuptemplates_id` (`itilfollowuptemplates_id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `solutiontemplates_id` (`solutiontemplates_id`),
  KEY `calendars_id` (`calendars_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_pendingreasons` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_pendingreasons` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_pendingreasons_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_pendingreasons_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `pendingreasons_id` int(10) unsigned NOT NULL DEFAULT 0,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(100) NOT NULL DEFAULT '',
  `followup_frequency` int(11) NOT NULL DEFAULT 0,
  `followups_before_resolution` int(11) NOT NULL DEFAULT 0,
  `bump_count` int(11) NOT NULL DEFAULT 0,
  `last_bump_date` timestamp NULL DEFAULT NULL,
  `previous_status` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`items_id`,`itemtype`),
  KEY `pendingreasons_id` (`pendingreasons_id`),
  KEY `item` (`itemtype`,`items_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_pendingreasons_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_pendingreasons_items` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_peripheralmodels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_peripheralmodels` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `product_number` varchar(255) DEFAULT NULL,
  `weight` int(11) NOT NULL DEFAULT 0,
  `required_units` int(11) NOT NULL DEFAULT 1,
  `depth` float NOT NULL DEFAULT 1,
  `power_connections` int(11) NOT NULL DEFAULT 0,
  `power_consumption` int(11) NOT NULL DEFAULT 0,
  `is_half_rack` tinyint(4) NOT NULL DEFAULT 0,
  `picture_front` text DEFAULT NULL,
  `picture_rear` text DEFAULT NULL,
  `pictures` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `product_number` (`product_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_peripheralmodels` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_peripheralmodels` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_peripherals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_peripherals` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `contact` varchar(255) DEFAULT NULL,
  `contact_num` varchar(255) DEFAULT NULL,
  `users_id_tech` int(10) unsigned NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `serial` varchar(255) DEFAULT NULL,
  `otherserial` varchar(255) DEFAULT NULL,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `peripheraltypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `peripheralmodels_id` int(10) unsigned NOT NULL DEFAULT 0,
  `brand` varchar(255) DEFAULT NULL,
  `manufacturers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_global` tinyint(4) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_template` tinyint(4) NOT NULL DEFAULT 0,
  `template_name` varchar(255) DEFAULT NULL,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `states_id` int(10) unsigned NOT NULL DEFAULT 0,
  `ticket_tco` decimal(20,4) DEFAULT 0.0000,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `autoupdatesystems_id` int(10) unsigned NOT NULL DEFAULT 0,
  `uuid` varchar(255) DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `is_template` (`is_template`),
  KEY `is_global` (`is_global`),
  KEY `entities_id` (`entities_id`),
  KEY `manufacturers_id` (`manufacturers_id`),
  KEY `users_id` (`users_id`),
  KEY `locations_id` (`locations_id`),
  KEY `peripheralmodels_id` (`peripheralmodels_id`),
  KEY `states_id` (`states_id`),
  KEY `users_id_tech` (`users_id_tech`),
  KEY `peripheraltypes_id` (`peripheraltypes_id`),
  KEY `active_assets` (`is_deleted`,`is_template`),
  KEY `date_mod` (`date_mod`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `autoupdatesystems_id` (`autoupdatesystems_id`),
  KEY `serial` (`serial`),
  KEY `otherserial` (`otherserial`),
  KEY `uuid` (`uuid`),
  KEY `date_creation` (`date_creation`),
  KEY `is_recursive` (`is_recursive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_peripherals` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_peripherals` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_peripheraltypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_peripheraltypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_peripheraltypes` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_peripheraltypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_phonemodels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_phonemodels` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `product_number` varchar(255) DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `picture_front` text DEFAULT NULL,
  `picture_rear` text DEFAULT NULL,
  `pictures` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `product_number` (`product_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_phonemodels` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_phonemodels` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_phonepowersupplies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_phonepowersupplies` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_phonepowersupplies` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_phonepowersupplies` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_phones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_phones` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `contact` varchar(255) DEFAULT NULL,
  `contact_num` varchar(255) DEFAULT NULL,
  `users_id_tech` int(10) unsigned NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `serial` varchar(255) DEFAULT NULL,
  `otherserial` varchar(255) DEFAULT NULL,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `phonetypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `phonemodels_id` int(10) unsigned NOT NULL DEFAULT 0,
  `brand` varchar(255) DEFAULT NULL,
  `phonepowersupplies_id` int(10) unsigned NOT NULL DEFAULT 0,
  `number_line` varchar(255) DEFAULT NULL,
  `have_headset` tinyint(4) NOT NULL DEFAULT 0,
  `have_hp` tinyint(4) NOT NULL DEFAULT 0,
  `manufacturers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_global` tinyint(4) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_template` tinyint(4) NOT NULL DEFAULT 0,
  `template_name` varchar(255) DEFAULT NULL,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `states_id` int(10) unsigned NOT NULL DEFAULT 0,
  `ticket_tco` decimal(20,4) DEFAULT 0.0000,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `autoupdatesystems_id` int(10) unsigned NOT NULL DEFAULT 0,
  `uuid` varchar(255) DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `last_inventory_update` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `is_template` (`is_template`),
  KEY `is_global` (`is_global`),
  KEY `entities_id` (`entities_id`),
  KEY `manufacturers_id` (`manufacturers_id`),
  KEY `users_id` (`users_id`),
  KEY `locations_id` (`locations_id`),
  KEY `phonemodels_id` (`phonemodels_id`),
  KEY `phonepowersupplies_id` (`phonepowersupplies_id`),
  KEY `states_id` (`states_id`),
  KEY `users_id_tech` (`users_id_tech`),
  KEY `phonetypes_id` (`phonetypes_id`),
  KEY `active_assets` (`is_deleted`,`is_template`),
  KEY `date_mod` (`date_mod`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `autoupdatesystems_id` (`autoupdatesystems_id`),
  KEY `serial` (`serial`),
  KEY `otherserial` (`otherserial`),
  KEY `uuid` (`uuid`),
  KEY `date_creation` (`date_creation`),
  KEY `is_recursive` (`is_recursive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_phones` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_phones` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_phonetypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_phonetypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_phonetypes` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_phonetypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_planningeventcategories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_planningeventcategories` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `color` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_planningeventcategories` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_planningeventcategories` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_planningexternalevents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_planningexternalevents` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) DEFAULT NULL,
  `planningexternaleventtemplates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 1,
  `date` timestamp NULL DEFAULT NULL,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id_guests` text DEFAULT NULL,
  `groups_id` int(10) unsigned NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `text` text DEFAULT NULL,
  `begin` timestamp NULL DEFAULT NULL,
  `end` timestamp NULL DEFAULT NULL,
  `rrule` text DEFAULT NULL,
  `state` int(11) NOT NULL DEFAULT 0,
  `planningeventcategories_id` int(10) unsigned NOT NULL DEFAULT 0,
  `background` tinyint(4) NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `name` (`name`),
  KEY `planningexternaleventtemplates_id` (`planningexternaleventtemplates_id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `date` (`date`),
  KEY `begin` (`begin`),
  KEY `end` (`end`),
  KEY `users_id` (`users_id`),
  KEY `groups_id` (`groups_id`),
  KEY `state` (`state`),
  KEY `planningeventcategories_id` (`planningeventcategories_id`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_planningexternalevents` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_planningexternalevents` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_planningexternaleventtemplates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_planningexternaleventtemplates` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `text` mediumtext DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `duration` int(11) NOT NULL DEFAULT 0,
  `before_time` int(11) NOT NULL DEFAULT 0,
  `rrule` text DEFAULT NULL,
  `state` int(11) NOT NULL DEFAULT 0,
  `planningeventcategories_id` int(10) unsigned NOT NULL DEFAULT 0,
  `background` tinyint(4) NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `state` (`state`),
  KEY `planningeventcategories_id` (`planningeventcategories_id`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_planningexternaleventtemplates` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_planningexternaleventtemplates` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_planningrecalls`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_planningrecalls` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(100) NOT NULL,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `before_time` int(11) NOT NULL DEFAULT -10,
  `when` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`itemtype`,`items_id`,`users_id`),
  KEY `users_id` (`users_id`),
  KEY `before_time` (`before_time`),
  KEY `when` (`when`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_planningrecalls` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_planningrecalls` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_plugins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_plugins` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `directory` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `version` varchar(255) NOT NULL,
  `state` int(11) NOT NULL DEFAULT 0,
  `author` varchar(255) DEFAULT NULL,
  `highest_available_version` varchar(255) DEFAULT NULL,
  `homepage` varchar(255) DEFAULT NULL,
  `license` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`directory`),
  KEY `name` (`name`),
  KEY `state` (`state`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_plugins` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_plugins` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_plugs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_plugs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_plugs` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_plugs` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_printerlogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_printerlogs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `itemtype` varchar(100) NOT NULL,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `total_pages` int(11) NOT NULL DEFAULT 0,
  `bw_pages` int(11) NOT NULL DEFAULT 0,
  `color_pages` int(11) NOT NULL DEFAULT 0,
  `rv_pages` int(11) NOT NULL DEFAULT 0,
  `prints` int(11) NOT NULL DEFAULT 0,
  `bw_prints` int(11) NOT NULL DEFAULT 0,
  `color_prints` int(11) NOT NULL DEFAULT 0,
  `copies` int(11) NOT NULL DEFAULT 0,
  `bw_copies` int(11) NOT NULL DEFAULT 0,
  `color_copies` int(11) NOT NULL DEFAULT 0,
  `scanned` int(11) NOT NULL DEFAULT 0,
  `date` date DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `faxed` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`itemtype`,`items_id`,`date`),
  KEY `date` (`date`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_printerlogs` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_printerlogs` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_printermodels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_printermodels` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `product_number` varchar(255) DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `picture_front` text DEFAULT NULL,
  `picture_rear` text DEFAULT NULL,
  `pictures` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `product_number` (`product_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_printermodels` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_printermodels` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_printers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_printers` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `contact` varchar(255) DEFAULT NULL,
  `contact_num` varchar(255) DEFAULT NULL,
  `users_id_tech` int(10) unsigned NOT NULL DEFAULT 0,
  `serial` varchar(255) DEFAULT NULL,
  `otherserial` varchar(255) DEFAULT NULL,
  `have_serial` tinyint(4) NOT NULL DEFAULT 0,
  `have_parallel` tinyint(4) NOT NULL DEFAULT 0,
  `have_usb` tinyint(4) NOT NULL DEFAULT 0,
  `have_wifi` tinyint(4) NOT NULL DEFAULT 0,
  `have_ethernet` tinyint(4) NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `memory_size` varchar(255) DEFAULT NULL,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `networks_id` int(10) unsigned NOT NULL DEFAULT 0,
  `printertypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `printermodels_id` int(10) unsigned NOT NULL DEFAULT 0,
  `manufacturers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_global` tinyint(4) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_template` tinyint(4) NOT NULL DEFAULT 0,
  `template_name` varchar(255) DEFAULT NULL,
  `init_pages_counter` int(11) NOT NULL DEFAULT 0,
  `last_pages_counter` int(11) NOT NULL DEFAULT 0,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `states_id` int(10) unsigned NOT NULL DEFAULT 0,
  `ticket_tco` decimal(20,4) DEFAULT 0.0000,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `uuid` varchar(255) DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `sysdescr` text DEFAULT NULL,
  `last_inventory_update` timestamp NULL DEFAULT NULL,
  `snmpcredentials_id` int(10) unsigned NOT NULL DEFAULT 0,
  `autoupdatesystems_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `is_template` (`is_template`),
  KEY `is_global` (`is_global`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `manufacturers_id` (`manufacturers_id`),
  KEY `users_id` (`users_id`),
  KEY `locations_id` (`locations_id`),
  KEY `printermodels_id` (`printermodels_id`),
  KEY `networks_id` (`networks_id`),
  KEY `states_id` (`states_id`),
  KEY `users_id_tech` (`users_id_tech`),
  KEY `printertypes_id` (`printertypes_id`),
  KEY `active_assets` (`is_deleted`,`is_template`),
  KEY `date_mod` (`date_mod`),
  KEY `last_pages_counter` (`last_pages_counter`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `serial` (`serial`),
  KEY `otherserial` (`otherserial`),
  KEY `uuid` (`uuid`),
  KEY `date_creation` (`date_creation`),
  KEY `snmpcredentials_id` (`snmpcredentials_id`),
  KEY `autoupdatesystems_id` (`autoupdatesystems_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_printers` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_printers` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_printers_cartridgeinfos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_printers_cartridgeinfos` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `printers_id` int(10) unsigned NOT NULL,
  `property` varchar(255) NOT NULL,
  `value` varchar(255) NOT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `printers_id` (`printers_id`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_printers_cartridgeinfos` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_printers_cartridgeinfos` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_printertypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_printertypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_printertypes` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_printertypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_problemcosts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_problemcosts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `problems_id` int(10) unsigned NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `begin_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `actiontime` int(11) NOT NULL DEFAULT 0,
  `cost_time` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `cost_fixed` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `cost_material` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `budgets_id` int(10) unsigned NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `problems_id` (`problems_id`),
  KEY `begin_date` (`begin_date`),
  KEY `end_date` (`end_date`),
  KEY `entities_id` (`entities_id`),
  KEY `budgets_id` (`budgets_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_problemcosts` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_problemcosts` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_problems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_problems` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `status` int(11) NOT NULL DEFAULT 1,
  `content` longtext DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date` timestamp NULL DEFAULT NULL,
  `solvedate` timestamp NULL DEFAULT NULL,
  `closedate` timestamp NULL DEFAULT NULL,
  `time_to_resolve` timestamp NULL DEFAULT NULL,
  `users_id_recipient` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id_lastupdater` int(10) unsigned NOT NULL DEFAULT 0,
  `urgency` int(11) NOT NULL DEFAULT 1,
  `impact` int(11) NOT NULL DEFAULT 1,
  `priority` int(11) NOT NULL DEFAULT 1,
  `itilcategories_id` int(10) unsigned NOT NULL DEFAULT 0,
  `impactcontent` longtext DEFAULT NULL,
  `causecontent` longtext DEFAULT NULL,
  `symptomcontent` longtext DEFAULT NULL,
  `actiontime` int(11) NOT NULL DEFAULT 0,
  `begin_waiting_date` timestamp NULL DEFAULT NULL,
  `waiting_duration` int(11) NOT NULL DEFAULT 0,
  `close_delay_stat` int(11) NOT NULL DEFAULT 0,
  `solve_delay_stat` int(11) NOT NULL DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT NULL,
  `problemtemplates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `is_deleted` (`is_deleted`),
  KEY `date` (`date`),
  KEY `closedate` (`closedate`),
  KEY `status` (`status`),
  KEY `priority` (`priority`),
  KEY `date_mod` (`date_mod`),
  KEY `itilcategories_id` (`itilcategories_id`),
  KEY `users_id_recipient` (`users_id_recipient`),
  KEY `solvedate` (`solvedate`),
  KEY `urgency` (`urgency`),
  KEY `impact` (`impact`),
  KEY `time_to_resolve` (`time_to_resolve`),
  KEY `users_id_lastupdater` (`users_id_lastupdater`),
  KEY `date_creation` (`date_creation`),
  KEY `problemtemplates_id` (`problemtemplates_id`),
  KEY `locations_id` (`locations_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_problems` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_problems` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_problems_problems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_problems_problems` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `problems_id_1` int(10) unsigned NOT NULL DEFAULT 0,
  `problems_id_2` int(10) unsigned NOT NULL DEFAULT 0,
  `link` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`problems_id_1`,`problems_id_2`),
  KEY `problems_id_2` (`problems_id_2`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_problems_problems` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_problems_problems` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_problems_suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_problems_suppliers` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `problems_id` int(10) unsigned NOT NULL DEFAULT 0,
  `suppliers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `type` int(11) NOT NULL DEFAULT 1,
  `use_notification` tinyint(4) NOT NULL DEFAULT 0,
  `alternative_email` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`problems_id`,`type`,`suppliers_id`),
  KEY `group` (`suppliers_id`,`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_problems_suppliers` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_problems_suppliers` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_problems_tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_problems_tickets` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `problems_id` int(10) unsigned NOT NULL DEFAULT 0,
  `tickets_id` int(10) unsigned NOT NULL DEFAULT 0,
  `link` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`problems_id`,`tickets_id`),
  KEY `tickets_id` (`tickets_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_problems_tickets` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_problems_tickets` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_problems_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_problems_users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `problems_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `type` int(11) NOT NULL DEFAULT 1,
  `use_notification` tinyint(4) NOT NULL DEFAULT 0,
  `alternative_email` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`problems_id`,`type`,`users_id`,`alternative_email`),
  KEY `user` (`users_id`,`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_problems_users` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_problems_users` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_problemtasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_problemtasks` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) DEFAULT NULL,
  `problems_id` int(10) unsigned NOT NULL DEFAULT 0,
  `taskcategories_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date` timestamp NULL DEFAULT NULL,
  `begin` timestamp NULL DEFAULT NULL,
  `end` timestamp NULL DEFAULT NULL,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id_editor` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id_tech` int(10) unsigned NOT NULL DEFAULT 0,
  `groups_id_tech` int(10) unsigned NOT NULL DEFAULT 0,
  `content` longtext DEFAULT NULL,
  `actiontime` int(11) NOT NULL DEFAULT 0,
  `state` int(11) NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `tasktemplates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `timeline_position` tinyint(4) NOT NULL DEFAULT 0,
  `is_private` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `problems_id` (`problems_id`),
  KEY `users_id` (`users_id`),
  KEY `users_id_editor` (`users_id_editor`),
  KEY `users_id_tech` (`users_id_tech`),
  KEY `groups_id_tech` (`groups_id_tech`),
  KEY `date` (`date`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `begin` (`begin`),
  KEY `end` (`end`),
  KEY `state` (`state`),
  KEY `taskcategories_id` (`taskcategories_id`),
  KEY `tasktemplates_id` (`tasktemplates_id`),
  KEY `is_private` (`is_private`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_problemtasks` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_problemtasks` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_problemtemplatehiddenfields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_problemtemplatehiddenfields` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `problemtemplates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `num` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`problemtemplates_id`,`num`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_problemtemplatehiddenfields` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_problemtemplatehiddenfields` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_problemtemplatemandatoryfields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_problemtemplatemandatoryfields` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `problemtemplates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `num` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`problemtemplates_id`,`num`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_problemtemplatemandatoryfields` DISABLE KEYS */;
INSERT INTO `glpi_problemtemplatemandatoryfields` VALUES
(1,1,21);
/*!40000 ALTER TABLE `glpi_problemtemplatemandatoryfields` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_problemtemplatepredefinedfields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_problemtemplatepredefinedfields` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `problemtemplates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `num` int(11) NOT NULL DEFAULT 0,
  `value` longtext DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `problemtemplates_id` (`problemtemplates_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_problemtemplatepredefinedfields` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_problemtemplatepredefinedfields` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_problemtemplatereadonlyfields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_problemtemplatereadonlyfields` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `problemtemplates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `num` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`problemtemplates_id`,`num`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_problemtemplatereadonlyfields` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_problemtemplatereadonlyfields` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_problemtemplates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_problemtemplates` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `allowed_statuses` varchar(255) NOT NULL DEFAULT '[1,7,2,3,4,5,8,6]',
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_problemtemplates` DISABLE KEYS */;
INSERT INTO `glpi_problemtemplates` VALUES
(1,'Default',0,1,NULL,'[1,7,2,3,4,5,8,6]');
/*!40000 ALTER TABLE `glpi_problemtemplates` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_profilerights`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_profilerights` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `profiles_id` int(10) unsigned NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `rights` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`profiles_id`,`name`),
  KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=798 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_profilerights` DISABLE KEYS */;
INSERT INTO `glpi_profilerights` VALUES
(1,1,'computer',0),
(2,1,'monitor',0),
(3,1,'software',0),
(4,1,'networking',0),
(5,1,'internet',0),
(6,1,'printer',0),
(7,1,'peripheral',0),
(8,1,'cartridge',0),
(9,1,'consumable',0),
(10,1,'phone',0),
(11,6,'queuednotification',0),
(12,1,'contact_enterprise',0),
(13,1,'document',0),
(14,1,'contract',0),
(15,1,'infocom',0),
(16,1,'knowbase',2048),
(17,1,'reservation',1024),
(18,1,'reports',0),
(19,1,'dropdown',0),
(20,1,'device',0),
(21,1,'typedoc',0),
(22,1,'link',0),
(23,1,'config',0),
(24,1,'rule_ticket',0),
(25,1,'rule_import',0),
(26,1,'rule_location',0),
(27,1,'rule_ldap',0),
(28,1,'rule_softwarecategories',0),
(29,1,'search_config',0),
(30,5,'location',0),
(31,7,'domain',31),
(32,1,'profile',0),
(33,1,'user',0),
(34,1,'group',0),
(35,1,'entity',0),
(36,1,'transfer',0),
(37,1,'logs',0),
(38,1,'reminder_public',1),
(39,1,'rssfeed_public',1),
(40,1,'bookmark_public',0),
(41,1,'backup',0),
(42,1,'ticket',5),
(43,1,'followup',5),
(44,1,'task',1),
(45,1,'planning',0),
(46,2,'state',0),
(47,2,'taskcategory',0),
(48,2,'tasktemplate',0),
(49,1,'statistic',0),
(50,1,'password_update',1),
(51,1,'show_group_hardware',0),
(52,1,'rule_dictionnary_software',0),
(53,1,'rule_dictionnary_dropdown',0),
(54,1,'budget',0),
(55,1,'notification',0),
(56,1,'rule_mailcollector',0),
(57,7,'solutiontemplate',23),
(58,7,'itilfollowuptemplate',23),
(59,7,'itilvalidationtemplate',23),
(60,1,'calendar',0),
(61,1,'slm',0),
(62,1,'rule_dictionnary_printer',0),
(63,1,'problem',0),
(64,2,'cable_management',0),
(65,4,'knowbasecategory',23),
(66,5,'itilcategory',0),
(67,1,'itiltemplate',0),
(68,1,'ticketrecurrent',0),
(69,1,'ticketcost',0),
(70,6,'changevalidation',20),
(71,1,'ticketvalidation',0),
(72,2,'computer',1313),
(73,2,'monitor',1313),
(74,2,'software',1313),
(75,2,'networking',1313),
(76,2,'internet',1),
(77,2,'printer',1313),
(78,2,'peripheral',1313),
(79,2,'cartridge',289),
(80,2,'consumable',289),
(81,2,'phone',1313),
(82,5,'queuednotification',0),
(83,2,'contact_enterprise',33),
(84,2,'document',33),
(85,2,'contract',33),
(86,2,'infocom',1),
(87,2,'knowbase',10241),
(88,2,'reservation',1025),
(89,2,'reports',1),
(90,2,'dropdown',0),
(91,2,'device',0),
(92,2,'typedoc',1),
(93,2,'link',1),
(94,2,'config',0),
(95,2,'rule_ticket',0),
(96,2,'rule_import',0),
(97,2,'rule_location',0),
(98,2,'rule_ldap',0),
(99,2,'rule_softwarecategories',0),
(100,2,'search_config',1024),
(101,4,'location',23),
(102,6,'domain',0),
(103,2,'profile',0),
(104,2,'user',2049),
(105,2,'group',33),
(106,2,'entity',0),
(107,2,'transfer',0),
(108,2,'logs',0),
(109,2,'reminder_public',129),
(110,2,'rssfeed_public',129),
(111,2,'bookmark_public',0),
(112,2,'backup',0),
(113,2,'ticket',168989),
(114,2,'followup',5),
(115,2,'task',1),
(116,6,'projecttask',1025),
(117,7,'projecttask',1025),
(118,2,'planning',1),
(119,1,'state',0),
(120,1,'taskcategory',0),
(121,1,'tasktemplate',0),
(122,2,'statistic',1),
(123,2,'password_update',1),
(124,2,'show_group_hardware',0),
(125,2,'rule_dictionnary_software',0),
(126,2,'rule_dictionnary_dropdown',0),
(127,2,'budget',33),
(128,2,'notification',0),
(129,2,'rule_mailcollector',0),
(130,5,'solutiontemplate',0),
(131,5,'itilfollowuptemplate',0),
(132,5,'itilvalidationtemplate',0),
(133,6,'solutiontemplate',0),
(134,6,'itilfollowuptemplate',0),
(135,6,'itilvalidationtemplate',0),
(136,2,'calendar',0),
(137,2,'slm',0),
(138,2,'rule_dictionnary_printer',0),
(139,2,'problem',1057),
(140,1,'cable_management',0),
(141,3,'knowbasecategory',23),
(142,4,'itilcategory',23),
(143,2,'itiltemplate',0),
(144,2,'ticketrecurrent',0),
(145,2,'ticketcost',1),
(146,4,'changevalidation',1044),
(147,5,'changevalidation',20),
(148,2,'ticketvalidation',15376),
(149,3,'computer',3967),
(150,3,'monitor',3967),
(151,3,'software',3967),
(152,3,'networking',3967),
(153,3,'internet',31),
(154,3,'printer',3967),
(155,3,'peripheral',3967),
(156,3,'cartridge',3967),
(157,3,'consumable',3967),
(158,3,'phone',3967),
(159,4,'queuednotification',31),
(160,3,'contact_enterprise',127),
(161,3,'document',127),
(162,3,'contract',127),
(163,3,'infocom',23),
(164,3,'knowbase',14359),
(165,3,'reservation',1055),
(166,3,'reports',1),
(167,3,'dropdown',23),
(168,3,'device',23),
(169,3,'typedoc',23),
(170,3,'link',23),
(171,3,'config',0),
(172,3,'rule_ticket',1047),
(173,3,'rule_import',0),
(174,3,'rule_location',0),
(175,3,'rule_ldap',0),
(176,3,'rule_softwarecategories',0),
(177,3,'search_config',3072),
(178,3,'location',23),
(179,5,'domain',0),
(180,3,'profile',1),
(181,3,'user',7199),
(182,3,'group',119),
(183,3,'entity',33),
(184,3,'transfer',1),
(185,3,'logs',1),
(186,3,'reminder_public',151),
(187,3,'rssfeed_public',151),
(188,3,'bookmark_public',23),
(189,3,'backup',1024),
(190,3,'ticket',523295),
(191,3,'followup',64535),
(192,3,'task',64535),
(193,3,'projecttask',1145),
(194,4,'projecttask',1145),
(195,5,'projecttask',0),
(196,3,'planning',3073),
(197,7,'taskcategory',23),
(198,7,'tasktemplate',23),
(199,7,'cable_management',31),
(200,3,'statistic',1),
(201,3,'password_update',1),
(202,3,'show_group_hardware',0),
(203,3,'rule_dictionnary_software',0),
(204,3,'rule_dictionnary_dropdown',0),
(205,3,'budget',127),
(206,3,'notification',0),
(207,3,'rule_mailcollector',23),
(208,3,'solutiontemplate',23),
(209,3,'itilfollowuptemplate',23),
(210,3,'itilvalidationtemplate',23),
(211,4,'solutiontemplate',23),
(212,4,'itilfollowuptemplate',23),
(213,4,'itilvalidationtemplate',23),
(214,3,'calendar',23),
(215,3,'slm',279),
(216,3,'rule_dictionnary_printer',0),
(217,3,'problem',1151),
(218,2,'knowbasecategory',0),
(219,3,'itilcategory',23),
(220,3,'itiltemplate',23),
(221,3,'ticketrecurrent',1),
(222,3,'ticketcost',23),
(223,2,'changevalidation',1044),
(224,3,'changevalidation',1044),
(225,3,'ticketvalidation',15376),
(226,4,'computer',4095),
(227,4,'monitor',4095),
(228,4,'software',4095),
(229,4,'networking',4095),
(230,4,'internet',159),
(231,4,'printer',4095),
(232,4,'peripheral',4095),
(233,4,'cartridge',3967),
(234,4,'consumable',3967),
(235,4,'phone',4095),
(236,4,'contact_enterprise',255),
(237,4,'document',255),
(238,4,'contract',255),
(239,4,'infocom',23),
(240,4,'knowbase',15383),
(241,4,'reservation',1055),
(242,4,'reports',1),
(243,4,'dropdown',23),
(244,4,'device',23),
(245,4,'typedoc',23),
(246,4,'link',159),
(247,4,'config',3),
(248,4,'rule_ticket',1047),
(249,4,'rule_import',23),
(250,4,'rule_location',23),
(251,4,'rule_ldap',23),
(252,4,'rule_softwarecategories',23),
(253,4,'search_config',3072),
(254,2,'location',0),
(255,4,'domain',31),
(256,4,'profile',23),
(257,4,'user',15519),
(258,4,'group',119),
(259,4,'entity',3327),
(260,4,'transfer',23),
(261,4,'logs',1),
(262,4,'reminder_public',159),
(263,4,'rssfeed_public',159),
(264,4,'bookmark_public',23),
(265,4,'backup',1045),
(266,4,'ticket',523295),
(267,4,'followup',64535),
(268,4,'task',64535),
(269,7,'project',1151),
(270,1,'projecttask',0),
(271,2,'projecttask',1025),
(272,4,'planning',3073),
(273,6,'taskcategory',0),
(274,6,'tasktemplate',0),
(275,6,'cable_management',0),
(276,4,'statistic',1),
(277,4,'password_update',1),
(278,4,'show_group_hardware',1),
(279,4,'rule_dictionnary_software',23),
(280,4,'rule_dictionnary_dropdown',23),
(281,4,'budget',127),
(282,4,'notification',23),
(283,4,'rule_mailcollector',23),
(284,1,'solutiontemplate',0),
(285,1,'itilfollowuptemplate',0),
(286,1,'itilvalidationtemplate',0),
(287,2,'solutiontemplate',0),
(288,2,'itilfollowuptemplate',0),
(289,2,'itilvalidationtemplate',0),
(290,4,'calendar',23),
(291,4,'slm',279),
(292,4,'rule_dictionnary_printer',23),
(293,4,'problem',1151),
(294,1,'knowbasecategory',0),
(295,2,'itilcategory',0),
(296,4,'itiltemplate',23),
(297,4,'ticketrecurrent',23),
(298,4,'ticketcost',23),
(299,7,'change',132223),
(300,1,'changevalidation',0),
(301,4,'ticketvalidation',15376),
(302,5,'computer',0),
(303,5,'monitor',0),
(304,5,'software',0),
(305,5,'networking',0),
(306,5,'internet',0),
(307,5,'printer',0),
(308,5,'peripheral',0),
(309,5,'cartridge',0),
(310,5,'consumable',0),
(311,5,'phone',0),
(312,3,'queuednotification',0),
(313,5,'contact_enterprise',0),
(314,5,'document',0),
(315,5,'contract',0),
(316,5,'infocom',0),
(317,5,'knowbase',10240),
(318,5,'reservation',0),
(319,5,'reports',0),
(320,5,'dropdown',0),
(321,5,'device',0),
(322,5,'typedoc',0),
(323,5,'link',0),
(324,5,'config',0),
(325,5,'rule_ticket',0),
(326,5,'rule_import',0),
(327,5,'rule_location',0),
(328,5,'rule_ldap',0),
(329,5,'rule_softwarecategories',0),
(330,5,'search_config',0),
(331,1,'location',0),
(332,3,'domain',31),
(333,5,'profile',0),
(334,5,'user',1025),
(335,5,'group',0),
(336,5,'entity',0),
(337,5,'transfer',0),
(338,5,'logs',0),
(339,5,'reminder_public',128),
(340,5,'rssfeed_public',128),
(341,5,'bookmark_public',0),
(342,5,'backup',0),
(343,5,'ticket',402439),
(344,5,'followup',12295),
(345,5,'task',12295),
(346,4,'project',1151),
(347,5,'project',1151),
(348,6,'project',1151),
(349,5,'planning',1),
(350,5,'taskcategory',0),
(351,5,'tasktemplate',0),
(352,5,'cable_management',0),
(353,5,'statistic',1),
(354,5,'password_update',1),
(355,5,'show_group_hardware',0),
(356,5,'rule_dictionnary_software',0),
(357,5,'rule_dictionnary_dropdown',0),
(358,5,'budget',0),
(359,5,'notification',0),
(360,5,'rule_mailcollector',0),
(361,6,'state',0),
(362,7,'state',23),
(363,5,'calendar',0),
(364,5,'slm',0),
(365,5,'rule_dictionnary_printer',0),
(366,5,'problem',1024),
(367,7,'knowbasecategory',23),
(368,1,'itilcategory',0),
(369,5,'itiltemplate',0),
(370,5,'ticketrecurrent',0),
(371,5,'ticketcost',23),
(372,5,'change',132126),
(373,6,'change',132223),
(374,5,'ticketvalidation',3088),
(375,6,'computer',3967),
(376,6,'monitor',3967),
(377,6,'software',3967),
(378,6,'networking',3967),
(379,6,'internet',31),
(380,6,'printer',3967),
(381,6,'peripheral',3967),
(382,6,'cartridge',895),
(383,6,'consumable',895),
(384,6,'phone',3967),
(385,2,'queuednotification',0),
(386,6,'contact_enterprise',96),
(387,6,'document',127),
(388,6,'contract',96),
(389,6,'infocom',0),
(390,6,'knowbase',14359),
(391,6,'reservation',1055),
(392,6,'reports',1),
(393,6,'dropdown',0),
(394,6,'device',0),
(395,6,'typedoc',0),
(396,6,'link',0),
(397,6,'config',0),
(398,6,'rule_ticket',0),
(399,6,'rule_import',0),
(400,6,'rule_location',0),
(401,6,'rule_ldap',0),
(402,6,'rule_softwarecategories',0),
(403,6,'search_config',0),
(404,2,'domain',0),
(405,6,'profile',0),
(406,6,'user',1055),
(407,6,'group',1),
(408,6,'entity',33),
(409,6,'transfer',1),
(410,6,'logs',0),
(411,6,'reminder_public',151),
(412,6,'rssfeed_public',151),
(413,6,'bookmark_public',0),
(414,6,'backup',0),
(415,6,'ticket',429063),
(416,6,'followup',64535),
(417,6,'task',64535),
(418,1,'project',0),
(419,2,'project',1025),
(420,3,'project',1151),
(421,6,'planning',1),
(422,4,'taskcategory',23),
(423,4,'tasktemplate',23),
(424,4,'cable_management',31),
(425,6,'statistic',1),
(426,6,'password_update',1),
(427,6,'show_group_hardware',0),
(428,6,'rule_dictionnary_software',0),
(429,6,'rule_dictionnary_dropdown',0),
(430,6,'budget',96),
(431,6,'notification',0),
(432,6,'rule_mailcollector',0),
(433,4,'state',23),
(434,5,'state',0),
(435,6,'calendar',0),
(436,6,'slm',257),
(437,6,'rule_dictionnary_printer',0),
(438,6,'problem',1151),
(439,6,'knowbasecategory',0),
(440,7,'itilcategory',23),
(441,7,'location',23),
(442,6,'itiltemplate',1),
(443,6,'ticketrecurrent',1),
(444,6,'ticketcost',23),
(445,3,'change',132223),
(446,4,'change',132223),
(447,6,'ticketvalidation',3088),
(448,7,'computer',3967),
(449,7,'monitor',3967),
(450,7,'software',3967),
(451,7,'networking',3967),
(452,7,'internet',31),
(453,7,'printer',3967),
(454,7,'peripheral',3967),
(455,7,'cartridge',895),
(456,7,'consumable',895),
(457,7,'phone',3967),
(458,1,'queuednotification',0),
(459,7,'contact_enterprise',97),
(460,7,'document',127),
(461,7,'contract',97),
(462,7,'infocom',0),
(463,7,'knowbase',14359),
(464,7,'reservation',1055),
(465,7,'reports',1),
(466,7,'dropdown',0),
(467,7,'device',0),
(468,7,'typedoc',0),
(469,7,'link',0),
(470,7,'config',0),
(471,7,'rule_ticket',1047),
(472,7,'rule_import',0),
(473,7,'rule_location',0),
(474,7,'rule_ldap',0),
(475,7,'rule_softwarecategories',0),
(476,7,'search_config',1024),
(477,1,'domain',0),
(478,7,'profile',0),
(479,7,'user',1055),
(480,7,'group',1),
(481,7,'entity',33),
(482,7,'transfer',1),
(483,7,'logs',1),
(484,7,'reminder_public',151),
(485,7,'rssfeed_public',151),
(486,7,'bookmark_public',0),
(487,7,'backup',0),
(488,7,'ticket',523295),
(489,7,'followup',64535),
(490,7,'task',64535),
(491,7,'queuednotification',0),
(492,7,'planning',3073),
(493,3,'taskcategory',23),
(494,3,'tasktemplate',23),
(495,3,'cable_management',31),
(496,7,'statistic',1),
(497,7,'password_update',1),
(498,7,'show_group_hardware',0),
(499,7,'rule_dictionnary_software',0),
(500,7,'rule_dictionnary_dropdown',0),
(501,7,'budget',97),
(502,7,'notification',0),
(503,7,'rule_mailcollector',23),
(504,7,'changevalidation',1044),
(505,3,'state',23),
(506,7,'calendar',23),
(507,7,'slm',279),
(508,7,'rule_dictionnary_printer',0),
(509,7,'problem',1151),
(510,5,'knowbasecategory',0),
(511,6,'itilcategory',0),
(512,6,'location',0),
(513,7,'itiltemplate',23),
(514,7,'ticketrecurrent',1),
(515,7,'ticketcost',23),
(516,1,'change',0),
(517,2,'change',132129),
(518,7,'ticketvalidation',15376),
(519,8,'backup',1),
(520,8,'bookmark_public',1),
(521,8,'budget',33),
(522,8,'calendar',1),
(523,8,'cartridge',289),
(524,8,'change',132129),
(525,8,'changevalidation',0),
(526,8,'computer',1313),
(527,8,'config',1),
(528,8,'consumable',289),
(529,8,'contact_enterprise',33),
(530,8,'contract',33),
(531,8,'device',1),
(532,8,'document',33),
(533,8,'domain',1),
(534,8,'dropdown',1),
(535,8,'entity',33),
(536,8,'followup',8193),
(537,8,'global_validation',0),
(538,8,'group',33),
(539,8,'infocom',1),
(540,8,'internet',1),
(541,8,'itilcategory',1),
(542,8,'knowbase',10241),
(543,8,'knowbasecategory',1),
(544,8,'link',1),
(545,8,'location',1),
(546,8,'logs',1),
(547,8,'monitor',1313),
(548,8,'cable_management',1),
(549,8,'networking',1313),
(550,8,'notification',1),
(551,8,'password_update',0),
(552,8,'peripheral',1313),
(553,8,'phone',1313),
(554,8,'planning',3073),
(555,8,'printer',1313),
(556,8,'problem',132129),
(557,8,'profile',1),
(558,8,'project',132129),
(559,8,'projecttask',33),
(560,8,'queuednotification',1),
(561,8,'reminder_public',1),
(562,8,'reports',1),
(563,8,'reservation',129),
(564,8,'rssfeed_public',129),
(565,8,'rule_dictionnary_dropdown',1),
(566,8,'rule_dictionnary_printer',1),
(567,8,'rule_dictionnary_software',1),
(568,8,'rule_import',1),
(569,8,'rule_location',1),
(570,8,'rule_ldap',1),
(571,8,'rule_mailcollector',1),
(572,8,'rule_softwarecategories',1),
(573,8,'rule_ticket',1),
(574,8,'search_config',0),
(575,8,'show_group_hardware',1),
(576,8,'slm',1),
(577,8,'software',1313),
(578,8,'solutiontemplate',1),
(579,8,'itilfollowuptemplate',1),
(580,8,'state',1),
(581,8,'statistic',1),
(582,8,'task',8193),
(583,8,'taskcategory',1),
(584,8,'tasktemplate',1),
(585,8,'ticket',138241),
(586,8,'ticketcost',1),
(587,8,'ticketrecurrent',1),
(588,8,'itiltemplate',1),
(589,8,'ticketvalidation',0),
(590,8,'transfer',1),
(591,8,'typedoc',1),
(592,8,'user',1),
(593,1,'license',0),
(594,2,'license',33),
(595,3,'license',127),
(596,4,'license',255),
(597,5,'license',0),
(598,6,'license',127),
(599,7,'license',127),
(600,8,'license',33),
(601,1,'line',0),
(602,2,'line',33),
(603,3,'line',127),
(604,4,'line',255),
(605,5,'line',0),
(606,6,'line',127),
(607,7,'line',127),
(608,8,'line',33),
(609,1,'lineoperator',0),
(610,2,'lineoperator',33),
(611,3,'lineoperator',119),
(612,4,'lineoperator',119),
(613,5,'lineoperator',0),
(614,6,'lineoperator',0),
(615,7,'lineoperator',23),
(616,8,'lineoperator',1),
(617,1,'devicesimcard_pinpuk',0),
(618,2,'devicesimcard_pinpuk',1),
(619,3,'devicesimcard_pinpuk',3),
(620,4,'devicesimcard_pinpuk',3),
(621,5,'devicesimcard_pinpuk',0),
(622,6,'devicesimcard_pinpuk',3),
(623,7,'devicesimcard_pinpuk',3),
(624,8,'devicesimcard_pinpuk',1),
(625,1,'certificate',0),
(626,2,'certificate',33),
(627,3,'certificate',127),
(628,4,'certificate',255),
(629,5,'certificate',0),
(630,6,'certificate',127),
(631,7,'certificate',127),
(632,8,'certificate',33),
(633,1,'datacenter',0),
(634,2,'datacenter',1),
(635,3,'datacenter',31),
(636,4,'datacenter',31),
(637,5,'datacenter',0),
(638,6,'datacenter',31),
(639,7,'datacenter',31),
(640,8,'datacenter',1),
(641,4,'rule_asset',1047),
(642,1,'personalization',3),
(643,2,'personalization',3),
(644,3,'personalization',3),
(645,4,'personalization',3),
(646,5,'personalization',3),
(647,6,'personalization',3),
(648,7,'personalization',3),
(649,8,'personalization',3),
(650,1,'rule_asset',0),
(651,2,'rule_asset',0),
(652,3,'rule_asset',0),
(653,5,'rule_asset',0),
(654,6,'rule_asset',0),
(655,7,'rule_asset',0),
(656,8,'rule_asset',0),
(657,1,'global_validation',0),
(658,2,'global_validation',0),
(659,3,'global_validation',0),
(660,4,'global_validation',0),
(661,5,'global_validation',0),
(662,6,'global_validation',0),
(663,7,'global_validation',0),
(664,1,'cluster',0),
(665,2,'cluster',1),
(666,3,'cluster',31),
(667,4,'cluster',31),
(668,5,'cluster',0),
(669,6,'cluster',31),
(670,7,'cluster',31),
(671,8,'cluster',1),
(672,1,'externalevent',0),
(673,2,'externalevent',1),
(674,3,'externalevent',1055),
(675,4,'externalevent',1055),
(676,5,'externalevent',0),
(677,6,'externalevent',1),
(678,7,'externalevent',31),
(679,8,'externalevent',1),
(680,1,'dashboard',0),
(681,2,'dashboard',0),
(682,3,'dashboard',0),
(683,4,'dashboard',23),
(684,5,'dashboard',0),
(685,6,'dashboard',0),
(686,7,'dashboard',0),
(687,8,'dashboard',0),
(688,1,'appliance',0),
(689,2,'appliance',1),
(690,3,'appliance',31),
(691,4,'appliance',31),
(692,5,'appliance',0),
(693,6,'appliance',31),
(694,7,'appliance',31),
(695,8,'appliance',1),
(696,1,'inventory',0),
(697,2,'inventory',0),
(698,3,'inventory',3073),
(699,4,'inventory',3073),
(700,5,'inventory',0),
(701,6,'inventory',0),
(702,7,'inventory',0),
(703,8,'inventory',0),
(704,1,'pendingreason',0),
(705,2,'pendingreason',0),
(706,3,'pendingreason',31),
(707,4,'pendingreason',31),
(708,5,'pendingreason',1),
(709,6,'pendingreason',1),
(710,7,'pendingreason',1),
(711,8,'pendingreason',1),
(712,1,'database',0),
(713,2,'database',1),
(714,3,'database',31),
(715,4,'database',31),
(716,5,'database',0),
(717,6,'database',31),
(718,7,'database',31),
(719,8,'database',1),
(720,4,'rule_change',1047),
(721,3,'rule_change',1),
(722,8,'rule_change',1),
(723,4,'rule_problem',1047),
(724,3,'rule_problem',1),
(725,8,'rule_problem',1),
(726,1,'recurrentchange',0),
(727,2,'recurrentchange',0),
(728,3,'recurrentchange',1),
(729,4,'recurrentchange',31),
(730,5,'recurrentchange',0),
(731,6,'recurrentchange',1),
(732,7,'recurrentchange',1),
(733,8,'recurrentchange',1),
(734,1,'locked_field',0),
(735,2,'locked_field',0),
(736,3,'locked_field',0),
(737,4,'locked_field',6),
(738,5,'locked_field',0),
(739,6,'locked_field',0),
(740,7,'locked_field',0),
(741,8,'locked_field',0),
(742,1,'snmpcredential',0),
(743,2,'snmpcredential',0),
(744,3,'snmpcredential',0),
(745,4,'snmpcredential',31),
(746,5,'snmpcredential',0),
(747,6,'snmpcredential',0),
(748,7,'snmpcredential',0),
(749,8,'snmpcredential',0),
(750,1,'refusedequipment',0),
(751,2,'refusedequipment',0),
(752,3,'refusedequipment',0),
(753,4,'refusedequipment',19),
(754,5,'refusedequipment',0),
(755,6,'refusedequipment',0),
(756,7,'refusedequipment',0),
(757,8,'refusedequipment',0),
(758,1,'agent',0),
(759,2,'agent',0),
(760,3,'agent',0),
(761,4,'agent',19),
(762,5,'agent',0),
(763,6,'agent',0),
(764,7,'agent',0),
(765,8,'agent',0),
(766,1,'unmanaged',0),
(767,2,'unmanaged',0),
(768,3,'unmanaged',0),
(769,4,'unmanaged',27),
(770,5,'unmanaged',0),
(771,6,'unmanaged',0),
(772,7,'unmanaged',0),
(773,8,'unmanaged',0),
(774,1,'system_logs',0),
(775,2,'system_logs',0),
(776,3,'system_logs',0),
(777,4,'system_logs',1),
(778,5,'system_logs',0),
(779,6,'system_logs',0),
(780,7,'system_logs',0),
(781,8,'system_logs',0),
(782,1,'form',0),
(783,2,'form',0),
(784,3,'form',0),
(785,4,'form',31),
(786,5,'form',0),
(787,6,'form',0),
(788,7,'form',0),
(789,8,'form',0),
(790,1,'oauth_client',0),
(791,2,'oauth_client',0),
(792,3,'oauth_client',0),
(793,4,'oauth_client',31),
(794,5,'oauth_client',0),
(795,6,'oauth_client',0),
(796,7,'oauth_client',0),
(797,8,'oauth_client',0);
/*!40000 ALTER TABLE `glpi_profilerights` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_profiles` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `interface` varchar(255) DEFAULT 'helpdesk',
  `is_default` tinyint(4) NOT NULL DEFAULT 0,
  `helpdesk_hardware` int(11) NOT NULL DEFAULT 0,
  `helpdesk_item_type` text DEFAULT NULL,
  `use_mentions` int(11) NOT NULL DEFAULT 1,
  `ticket_status` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `problem_status` text DEFAULT NULL,
  `create_ticket_on_login` tinyint(4) NOT NULL DEFAULT 0,
  `tickettemplates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `changetemplates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `problemtemplates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `change_status` text DEFAULT NULL,
  `managed_domainrecordtypes` text DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `2fa_enforced` tinyint(4) NOT NULL DEFAULT 0,
  `last_rights_update` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `interface` (`interface`),
  KEY `is_default` (`is_default`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `tickettemplates_id` (`tickettemplates_id`),
  KEY `changetemplates_id` (`changetemplates_id`),
  KEY `problemtemplates_id` (`problemtemplates_id`),
  KEY `last_rights_update` (`last_rights_update`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_profiles` DISABLE KEYS */;
INSERT INTO `glpi_profiles` VALUES
(1,'Self-Service','helpdesk',1,1,'[\"Computer\",\"Monitor\",\"NetworkEquipment\",\"Peripheral\",\"Phone\",\"Printer\",\"Software\", \"DCRoom\", \"Rack\", \"Enclosure\", \"Database\"]',1,'{\"1\":{\"2\":0,\"3\":0,\"4\":0,\"5\":0,\"6\":0},\"2\":{\"1\":0,\"3\":0,\"4\":0,\"5\":0,\"6\":0},\"3\":{\"1\":0,\"2\":0,\"4\":0,\"5\":0,\"6\":0},\"4\":{\"1\":0,\"2\":0,\"3\":0,\"5\":0,\"6\":0},\"5\":{\"1\":0,\"2\":0,\"3\":0,\"4\":0},\"6\":{\"1\":0,\"2\":0,\"3\":0,\"4\":0,\"5\":0}}',NULL,'','[]',0,0,0,0,NULL,'[]',NULL,0,NULL),
(2,'Observer','central',0,1,'[\"Computer\",\"Monitor\",\"NetworkEquipment\",\"Peripheral\",\"Phone\",\"Printer\",\"Software\", \"DCRoom\", \"Rack\", \"Enclosure\", \"Database\"]',1,'[]',NULL,'','[]',0,0,0,0,NULL,'[]',NULL,0,NULL),
(3,'Admin','central',0,3,'[\"Computer\",\"Monitor\",\"NetworkEquipment\",\"Peripheral\",\"Phone\",\"Printer\",\"Software\", \"DCRoom\", \"Rack\", \"Enclosure\", \"Database\"]',1,'[]',NULL,'','[]',0,0,0,0,NULL,'[-1]',NULL,0,NULL),
(4,'Super-Admin','central',0,3,'[\"Computer\",\"Monitor\",\"NetworkEquipment\",\"Peripheral\",\"Phone\",\"Printer\",\"Software\", \"DCRoom\", \"Rack\", \"Enclosure\", \"Database\"]',1,'[]',NULL,'','[]',0,0,0,0,NULL,'[-1]',NULL,0,NULL),
(5,'Hotliner','central',0,3,'[\"Computer\",\"Monitor\",\"NetworkEquipment\",\"Peripheral\",\"Phone\",\"Printer\",\"Software\", \"DCRoom\", \"Rack\", \"Enclosure\", \"Database\"]',1,'[]',NULL,'','[]',1,0,0,0,NULL,'[]',NULL,0,NULL),
(6,'Technician','central',0,3,'[\"Computer\",\"Monitor\",\"NetworkEquipment\",\"Peripheral\",\"Phone\",\"Printer\",\"Software\", \"DCRoom\", \"Rack\", \"Enclosure\", \"Database\"]',1,'[]',NULL,'','[]',0,0,0,0,NULL,'[]',NULL,0,NULL),
(7,'Supervisor','central',0,3,'[\"Computer\",\"Monitor\",\"NetworkEquipment\",\"Peripheral\",\"Phone\",\"Printer\",\"Software\", \"DCRoom\", \"Rack\", \"Enclosure\", \"Database\"]',1,'[]',NULL,'','[]',0,0,0,0,NULL,'[]',NULL,0,NULL),
(8,'Read-Only','central',0,0,'[]',1,'{\"1\":{\"2\":0,\"3\":0,\"4\":0,\"5\":0,\"6\":0},\"2\":{\"1\":0,\"3\":0,\"4\":0,\"5\":0,\"6\":0},\"3\":{\"1\":0,\"2\":0,\"4\":0,\"5\":0,\"6\":0},\"4\":{\"1\":0,\"2\":0,\"3\":0,\"5\":0,\"6\":0},\"5\":{\"1\":0,\"2\":0,\"3\":0,\"4\":0,\"6\":0},\"6\":{\"1\":0,\"2\":0,\"3\":0,\"4\":0,\"5\":0}}',NULL,'This profile defines read-only access. It is used when objects are locked. It can also be used to give to users rights to unlock objects.','{\"1\":{\"7\":0,\"2\":0,\"3\":0,\"4\":0,\"5\":0,\"8\":0,\"6\":0},\"7\":{\"1\":0,\"2\":0,\"3\":0,\"4\":0,\"5\":0,\"8\":0,\"6\":0},\"2\":{\"1\":0,\"7\":0,\"3\":0,\"4\":0,\"5\":0,\"8\":0,\"6\":0},\"3\":{\"1\":0,\"7\":0,\"2\":0,\"4\":0,\"5\":0,\"8\":0,\"6\":0},\"4\":{\"1\":0,\"7\":0,\"2\":0,\"3\":0,\"5\":0,\"8\":0,\"6\":0},\"5\":{\"1\":0,\"7\":0,\"2\":0,\"3\":0,\"4\":0,\"8\":0,\"6\":0},\"8\":{\"1\":0,\"7\":0,\"2\":0,\"3\":0,\"4\":0,\"5\":0,\"6\":0},\"6\":{\"1\":0,\"7\":0,\"2\":0,\"3\":0,\"4\":0,\"5\":0,\"8\":0}}',0,0,0,0,'{\"1\":{\"9\":0,\"10\":0,\"7\":0,\"4\":0,\"11\":0,\"12\":0,\"5\":0,\"8\":0,\"6\":0},\"9\":{\"1\":0,\"10\":0,\"7\":0,\"4\":0,\"11\":0,\"12\":0,\"5\":0,\"8\":0,\"6\":0},\"10\":{\"1\":0,\"9\":0,\"7\":0,\"4\":0,\"11\":0,\"12\":0,\"5\":0,\"8\":0,\"6\":0},\"7\":{\"1\":0,\"9\":0,\"10\":0,\"4\":0,\"11\":0,\"12\":0,\"5\":0,\"8\":0,\"6\":0},\"4\":{\"1\":0,\"9\":0,\"10\":0,\"7\":0,\"11\":0,\"12\":0,\"5\":0,\"8\":0,\"6\":0},\"11\":{\"1\":0,\"9\":0,\"10\":0,\"7\":0,\"4\":0,\"12\":0,\"5\":0,\"8\":0,\"6\":0},\"12\":{\"1\":0,\"9\":0,\"10\":0,\"7\":0,\"4\":0,\"11\":0,\"5\":0,\"8\":0,\"6\":0},\"5\":{\"1\":0,\"9\":0,\"10\":0,\"7\":0,\"4\":0,\"11\":0,\"12\":0,\"8\":0,\"6\":0},\"8\":{\"1\":0,\"9\":0,\"10\":0,\"7\":0,\"4\":0,\"11\":0,\"12\":0,\"5\":0,\"6\":0},\"6\":{\"1\":0,\"9\":0,\"10\":0,\"7\":0,\"4\":0,\"11\":0,\"12\":0,\"5\":0,\"8\":0}}','[]',NULL,0,NULL);
/*!40000 ALTER TABLE `glpi_profiles` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_profiles_reminders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_profiles_reminders` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `reminders_id` int(10) unsigned NOT NULL DEFAULT 0,
  `profiles_id` int(10) unsigned NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned DEFAULT NULL,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `no_entity_restriction` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `reminders_id` (`reminders_id`),
  KEY `profiles_id` (`profiles_id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_profiles_reminders` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_profiles_reminders` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_profiles_rssfeeds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_profiles_rssfeeds` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `rssfeeds_id` int(10) unsigned NOT NULL DEFAULT 0,
  `profiles_id` int(10) unsigned NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned DEFAULT NULL,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `no_entity_restriction` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `rssfeeds_id` (`rssfeeds_id`),
  KEY `profiles_id` (`profiles_id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_profiles_rssfeeds` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_profiles_rssfeeds` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_profiles_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_profiles_users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `profiles_id` int(10) unsigned NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 1,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `is_default_profile` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `entities_id` (`entities_id`),
  KEY `profiles_id` (`profiles_id`),
  KEY `users_id` (`users_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `is_dynamic` (`is_dynamic`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_profiles_users` DISABLE KEYS */;
INSERT INTO `glpi_profiles_users` VALUES
(2,2,4,0,1,0,0),
(3,3,1,0,1,0,0),
(4,4,6,0,1,0,0),
(5,5,2,0,1,0,0),
(6,7,6,0,0,0,1),
(7,8,6,0,0,0,1),
(8,9,1,0,0,0,1);
/*!40000 ALTER TABLE `glpi_profiles_users` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_projectcosts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_projectcosts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `projects_id` int(10) unsigned NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `begin_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `cost` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `budgets_id` int(10) unsigned NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `projects_id` (`projects_id`),
  KEY `begin_date` (`begin_date`),
  KEY `end_date` (`end_date`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `budgets_id` (`budgets_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_projectcosts` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_projectcosts` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_projects` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `code` varchar(255) DEFAULT NULL,
  `priority` int(11) NOT NULL DEFAULT 1,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `projects_id` int(10) unsigned NOT NULL DEFAULT 0,
  `projectstates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `projecttypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date` timestamp NULL DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `groups_id` int(10) unsigned NOT NULL DEFAULT 0,
  `plan_start_date` timestamp NULL DEFAULT NULL,
  `plan_end_date` timestamp NULL DEFAULT NULL,
  `real_start_date` timestamp NULL DEFAULT NULL,
  `real_end_date` timestamp NULL DEFAULT NULL,
  `percent_done` int(11) NOT NULL DEFAULT 0,
  `auto_percent_done` tinyint(4) NOT NULL DEFAULT 0,
  `show_on_global_gantt` tinyint(4) NOT NULL DEFAULT 0,
  `content` longtext DEFAULT NULL,
  `comment` longtext DEFAULT NULL,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT NULL,
  `projecttemplates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_template` tinyint(4) NOT NULL DEFAULT 0,
  `template_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `code` (`code`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `projects_id` (`projects_id`),
  KEY `projectstates_id` (`projectstates_id`),
  KEY `projecttypes_id` (`projecttypes_id`),
  KEY `priority` (`priority`),
  KEY `date` (`date`),
  KEY `date_mod` (`date_mod`),
  KEY `users_id` (`users_id`),
  KEY `groups_id` (`groups_id`),
  KEY `plan_start_date` (`plan_start_date`),
  KEY `plan_end_date` (`plan_end_date`),
  KEY `real_start_date` (`real_start_date`),
  KEY `real_end_date` (`real_end_date`),
  KEY `percent_done` (`percent_done`),
  KEY `show_on_global_gantt` (`show_on_global_gantt`),
  KEY `date_creation` (`date_creation`),
  KEY `projecttemplates_id` (`projecttemplates_id`),
  KEY `is_template` (`is_template`),
  KEY `active_assets` (`is_deleted`,`is_template`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_projects` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_projects` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_projectstates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_projectstates` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `color` varchar(255) DEFAULT NULL,
  `is_finished` tinyint(4) NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `is_finished` (`is_finished`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_projectstates` DISABLE KEYS */;
INSERT INTO `glpi_projectstates` VALUES
(1,'New',NULL,'#06ff00',0,NULL,NULL),
(2,'Processing',NULL,'#ffb800',0,NULL,NULL),
(3,'Closed',NULL,'#ff0000',1,NULL,NULL);
/*!40000 ALTER TABLE `glpi_projectstates` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_projecttasklinks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_projecttasklinks` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `projecttasks_id_source` int(10) unsigned NOT NULL,
  `source_uuid` varchar(255) NOT NULL,
  `projecttasks_id_target` int(10) unsigned NOT NULL,
  `target_uuid` varchar(255) NOT NULL,
  `type` tinyint(4) NOT NULL DEFAULT 0,
  `lag` smallint(6) DEFAULT 0,
  `lead` smallint(6) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `projecttasks_id_source` (`projecttasks_id_source`),
  KEY `projecttasks_id_target` (`projecttasks_id_target`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_projecttasklinks` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_projecttasklinks` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_projecttasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_projecttasks` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `content` longtext DEFAULT NULL,
  `comment` longtext DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `projects_id` int(10) unsigned NOT NULL DEFAULT 0,
  `projecttasks_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `plan_start_date` timestamp NULL DEFAULT NULL,
  `plan_end_date` timestamp NULL DEFAULT NULL,
  `real_start_date` timestamp NULL DEFAULT NULL,
  `real_end_date` timestamp NULL DEFAULT NULL,
  `planned_duration` int(11) NOT NULL DEFAULT 0,
  `effective_duration` int(11) NOT NULL DEFAULT 0,
  `projectstates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `auto_projectstates` tinyint(4) NOT NULL DEFAULT 0,
  `projecttasktypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `percent_done` int(11) NOT NULL DEFAULT 0,
  `auto_percent_done` tinyint(4) NOT NULL DEFAULT 0,
  `is_milestone` tinyint(4) NOT NULL DEFAULT 0,
  `projecttasktemplates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_template` tinyint(4) NOT NULL DEFAULT 0,
  `template_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `projects_id` (`projects_id`),
  KEY `projecttasks_id` (`projecttasks_id`),
  KEY `date_creation` (`date_creation`),
  KEY `date_mod` (`date_mod`),
  KEY `users_id` (`users_id`),
  KEY `plan_start_date` (`plan_start_date`),
  KEY `plan_end_date` (`plan_end_date`),
  KEY `real_start_date` (`real_start_date`),
  KEY `real_end_date` (`real_end_date`),
  KEY `percent_done` (`percent_done`),
  KEY `projectstates_id` (`projectstates_id`),
  KEY `projecttasktypes_id` (`projecttasktypes_id`),
  KEY `projecttasktemplates_id` (`projecttasktemplates_id`),
  KEY `is_template` (`is_template`),
  KEY `active_assets` (`is_deleted`,`is_template`),
  KEY `is_milestone` (`is_milestone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_projecttasks` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_projecttasks` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_projecttasks_tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_projecttasks_tickets` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tickets_id` int(10) unsigned NOT NULL DEFAULT 0,
  `projecttasks_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`tickets_id`,`projecttasks_id`),
  KEY `projects_id` (`projecttasks_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_projecttasks_tickets` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_projecttasks_tickets` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_projecttaskteams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_projecttaskteams` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `projecttasks_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(100) DEFAULT NULL,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`projecttasks_id`,`itemtype`,`items_id`),
  KEY `item` (`itemtype`,`items_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_projecttaskteams` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_projecttaskteams` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_projecttasktemplates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_projecttasktemplates` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `description` longtext DEFAULT NULL,
  `comment` longtext DEFAULT NULL,
  `projects_id` int(10) unsigned NOT NULL DEFAULT 0,
  `projecttasks_id` int(10) unsigned NOT NULL DEFAULT 0,
  `plan_start_date` timestamp NULL DEFAULT NULL,
  `plan_end_date` timestamp NULL DEFAULT NULL,
  `real_start_date` timestamp NULL DEFAULT NULL,
  `real_end_date` timestamp NULL DEFAULT NULL,
  `planned_duration` int(11) NOT NULL DEFAULT 0,
  `effective_duration` int(11) NOT NULL DEFAULT 0,
  `projectstates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `projecttasktypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `percent_done` int(11) NOT NULL DEFAULT 0,
  `is_milestone` tinyint(4) NOT NULL DEFAULT 0,
  `comments` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `projects_id` (`projects_id`),
  KEY `projecttasks_id` (`projecttasks_id`),
  KEY `date_creation` (`date_creation`),
  KEY `date_mod` (`date_mod`),
  KEY `users_id` (`users_id`),
  KEY `plan_start_date` (`plan_start_date`),
  KEY `plan_end_date` (`plan_end_date`),
  KEY `real_start_date` (`real_start_date`),
  KEY `real_end_date` (`real_end_date`),
  KEY `percent_done` (`percent_done`),
  KEY `projectstates_id` (`projectstates_id`),
  KEY `projecttasktypes_id` (`projecttasktypes_id`),
  KEY `is_milestone` (`is_milestone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_projecttasktemplates` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_projecttasktemplates` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_projecttasktypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_projecttasktypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_projecttasktypes` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_projecttasktypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_projectteams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_projectteams` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `projects_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(100) DEFAULT NULL,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`projects_id`,`itemtype`,`items_id`),
  KEY `item` (`itemtype`,`items_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_projectteams` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_projectteams` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_projecttypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_projecttypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_projecttypes` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_projecttypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_queuednotifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_queuednotifications` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `itemtype` varchar(100) DEFAULT NULL,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `notificationtemplates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `sent_try` int(11) NOT NULL DEFAULT 0,
  `create_time` timestamp NULL DEFAULT NULL,
  `send_time` timestamp NULL DEFAULT NULL,
  `sent_time` timestamp NULL DEFAULT NULL,
  `name` text DEFAULT NULL,
  `sender` text DEFAULT NULL,
  `sendername` text DEFAULT NULL,
  `recipient` text DEFAULT NULL,
  `recipientname` text DEFAULT NULL,
  `replyto` text DEFAULT NULL,
  `replytoname` text DEFAULT NULL,
  `headers` text DEFAULT NULL,
  `body_html` longtext DEFAULT NULL,
  `body_text` longtext DEFAULT NULL,
  `messageid` text DEFAULT NULL,
  `documents` text DEFAULT NULL,
  `mode` varchar(20) NOT NULL,
  `event` varchar(255) DEFAULT NULL,
  `attach_documents` tinyint(4) NOT NULL DEFAULT 0,
  `itemtype_trigger` varchar(255) DEFAULT NULL,
  `items_id_trigger` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `item` (`itemtype`,`items_id`,`notificationtemplates_id`),
  KEY `is_deleted` (`is_deleted`),
  KEY `entities_id` (`entities_id`),
  KEY `sent_try` (`sent_try`),
  KEY `create_time` (`create_time`),
  KEY `send_time` (`send_time`),
  KEY `sent_time` (`sent_time`),
  KEY `mode` (`mode`),
  KEY `notificationtemplates_id` (`notificationtemplates_id`),
  KEY `recipient` (`recipient`(255)),
  KEY `item_trigger` (`itemtype_trigger`,`items_id_trigger`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_queuednotifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_queuednotifications` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_queuedwebhooks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_queuedwebhooks` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `itemtype` varchar(100) DEFAULT NULL,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `sent_try` int(11) NOT NULL DEFAULT 0,
  `webhooks_id` int(10) unsigned NOT NULL DEFAULT 0,
  `url` text DEFAULT NULL,
  `create_time` timestamp NULL DEFAULT NULL,
  `send_time` timestamp NULL DEFAULT NULL,
  `sent_time` timestamp NULL DEFAULT NULL,
  `headers` text DEFAULT NULL,
  `body` longtext DEFAULT NULL,
  `event` varchar(255) DEFAULT NULL,
  `last_status_code` int(11) DEFAULT NULL,
  `save_response_body` tinyint(4) NOT NULL DEFAULT 0,
  `response_body` longtext DEFAULT NULL,
  `http_method` varchar(255) DEFAULT 'POST',
  PRIMARY KEY (`id`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `entities_id` (`entities_id`),
  KEY `webhooks_id` (`webhooks_id`),
  KEY `is_deleted` (`is_deleted`),
  KEY `sent_try` (`sent_try`),
  KEY `create_time` (`create_time`),
  KEY `send_time` (`send_time`),
  KEY `sent_time` (`sent_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_queuedwebhooks` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_queuedwebhooks` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_rackmodels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_rackmodels` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `product_number` varchar(255) DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `pictures` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `product_number` (`product_number`),
  KEY `date_creation` (`date_creation`),
  KEY `date_mod` (`date_mod`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_rackmodels` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_rackmodels` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_racks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_racks` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `serial` varchar(255) DEFAULT NULL,
  `otherserial` varchar(255) DEFAULT NULL,
  `rackmodels_id` int(10) unsigned DEFAULT NULL,
  `manufacturers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `racktypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `states_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id_tech` int(10) unsigned NOT NULL DEFAULT 0,
  `width` int(11) DEFAULT NULL,
  `height` int(11) DEFAULT NULL,
  `depth` int(11) DEFAULT NULL,
  `number_units` int(11) DEFAULT 0,
  `is_template` tinyint(4) NOT NULL DEFAULT 0,
  `template_name` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `dcrooms_id` int(10) unsigned NOT NULL DEFAULT 0,
  `room_orientation` int(11) NOT NULL DEFAULT 0,
  `position` varchar(50) DEFAULT NULL,
  `bgcolor` varchar(7) DEFAULT NULL,
  `max_power` int(11) NOT NULL DEFAULT 0,
  `mesured_power` int(11) NOT NULL DEFAULT 0,
  `max_weight` int(11) NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `locations_id` (`locations_id`),
  KEY `rackmodels_id` (`rackmodels_id`),
  KEY `manufacturers_id` (`manufacturers_id`),
  KEY `racktypes_id` (`racktypes_id`),
  KEY `states_id` (`states_id`),
  KEY `users_id` (`users_id`),
  KEY `users_id_tech` (`users_id_tech`),
  KEY `is_template` (`is_template`),
  KEY `active_assets` (`is_deleted`,`is_template`),
  KEY `dcrooms_id` (`dcrooms_id`),
  KEY `date_creation` (`date_creation`),
  KEY `date_mod` (`date_mod`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_racks` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_racks` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_racktypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_racktypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `name` (`name`),
  KEY `date_creation` (`date_creation`),
  KEY `date_mod` (`date_mod`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_racktypes` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_racktypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_recurrentchanges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_recurrentchanges` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `is_active` tinyint(4) NOT NULL DEFAULT 0,
  `changetemplates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `begin_date` timestamp NULL DEFAULT NULL,
  `periodicity` varchar(255) DEFAULT NULL,
  `create_before` int(11) NOT NULL DEFAULT 0,
  `next_creation_date` timestamp NULL DEFAULT NULL,
  `calendars_id` int(10) unsigned NOT NULL DEFAULT 0,
  `end_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `is_active` (`is_active`),
  KEY `changetemplates_id` (`changetemplates_id`),
  KEY `next_creation_date` (`next_creation_date`),
  KEY `calendars_id` (`calendars_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_recurrentchanges` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_recurrentchanges` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_refusedequipments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_refusedequipments` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `itemtype` varchar(100) DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `ip` text DEFAULT NULL,
  `mac` text DEFAULT NULL,
  `rules_id` int(10) unsigned NOT NULL DEFAULT 0,
  `method` varchar(255) DEFAULT NULL,
  `serial` varchar(255) DEFAULT NULL,
  `uuid` varchar(255) DEFAULT NULL,
  `agents_id` int(10) unsigned NOT NULL DEFAULT 0,
  `autoupdatesystems_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `agents_id` (`agents_id`),
  KEY `autoupdatesystems_id` (`autoupdatesystems_id`),
  KEY `rules_id` (`rules_id`),
  KEY `date_creation` (`date_creation`),
  KEY `date_mod` (`date_mod`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_refusedequipments` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_refusedequipments` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_registeredids`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_registeredids` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(100) NOT NULL,
  `device_type` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `device_type` (`device_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_registeredids` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_registeredids` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_reminders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_reminders` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) DEFAULT NULL,
  `date` timestamp NULL DEFAULT NULL,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `text` text DEFAULT NULL,
  `begin` timestamp NULL DEFAULT NULL,
  `end` timestamp NULL DEFAULT NULL,
  `is_planned` tinyint(4) NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `state` int(11) NOT NULL DEFAULT 0,
  `begin_view_date` timestamp NULL DEFAULT NULL,
  `end_view_date` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `name` (`name`),
  KEY `date` (`date`),
  KEY `begin` (`begin`),
  KEY `end` (`end`),
  KEY `users_id` (`users_id`),
  KEY `is_planned` (`is_planned`),
  KEY `state` (`state`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_reminders` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_reminders` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_reminders_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_reminders_users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `reminders_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `reminders_id` (`reminders_id`),
  KEY `users_id` (`users_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_reminders_users` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_reminders_users` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_remindertranslations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_remindertranslations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `reminders_id` int(10) unsigned NOT NULL DEFAULT 0,
  `language` varchar(10) DEFAULT NULL,
  `name` text DEFAULT NULL,
  `text` longtext DEFAULT NULL,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `item` (`reminders_id`,`language`),
  KEY `users_id` (`users_id`),
  KEY `date_creation` (`date_creation`),
  KEY `date_mod` (`date_mod`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_remindertranslations` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_remindertranslations` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_requesttypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_requesttypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `is_helpdesk_default` tinyint(4) NOT NULL DEFAULT 0,
  `is_followup_default` tinyint(4) NOT NULL DEFAULT 0,
  `is_mail_default` tinyint(4) NOT NULL DEFAULT 0,
  `is_mailfollowup_default` tinyint(4) NOT NULL DEFAULT 0,
  `is_active` tinyint(4) NOT NULL DEFAULT 1,
  `is_ticketheader` tinyint(4) NOT NULL DEFAULT 1,
  `is_itilfollowup` tinyint(4) NOT NULL DEFAULT 1,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `is_helpdesk_default` (`is_helpdesk_default`),
  KEY `is_followup_default` (`is_followup_default`),
  KEY `is_mail_default` (`is_mail_default`),
  KEY `is_mailfollowup_default` (`is_mailfollowup_default`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `is_active` (`is_active`),
  KEY `is_ticketheader` (`is_ticketheader`),
  KEY `is_itilfollowup` (`is_itilfollowup`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_requesttypes` DISABLE KEYS */;
INSERT INTO `glpi_requesttypes` VALUES
(1,'Helpdesk',1,1,0,0,1,1,1,NULL,NULL,NULL),
(2,'E-Mail',0,0,1,1,1,1,1,NULL,NULL,NULL),
(3,'Phone',0,0,0,0,1,1,1,NULL,NULL,NULL),
(4,'Direct',0,0,0,0,1,1,1,NULL,NULL,NULL),
(5,'Written',0,0,0,0,1,1,1,NULL,NULL,NULL),
(6,'Other',0,0,0,0,1,1,1,NULL,NULL,NULL);
/*!40000 ALTER TABLE `glpi_requesttypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_reservationitems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_reservationitems` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `itemtype` varchar(100) NOT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`itemtype`,`items_id`),
  KEY `is_active` (`is_active`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_reservationitems` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_reservationitems` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_reservations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_reservations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `reservationitems_id` int(10) unsigned NOT NULL DEFAULT 0,
  `begin` timestamp NULL DEFAULT NULL,
  `end` timestamp NULL DEFAULT NULL,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `group` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `begin` (`begin`),
  KEY `end` (`end`),
  KEY `users_id` (`users_id`),
  KEY `resagroup` (`reservationitems_id`,`group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_reservations` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_reservations` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_rssfeeds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_rssfeeds` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `url` text DEFAULT NULL,
  `refresh_rate` int(11) NOT NULL DEFAULT 86400,
  `max_items` int(11) NOT NULL DEFAULT 20,
  `have_error` tinyint(4) NOT NULL DEFAULT 0,
  `is_active` tinyint(4) NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `users_id` (`users_id`),
  KEY `date_mod` (`date_mod`),
  KEY `have_error` (`have_error`),
  KEY `is_active` (`is_active`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_rssfeeds` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_rssfeeds` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_rssfeeds_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_rssfeeds_users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `rssfeeds_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `rssfeeds_id` (`rssfeeds_id`),
  KEY `users_id` (`users_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_rssfeeds_users` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_rssfeeds_users` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_ruleactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_ruleactions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `rules_id` int(10) unsigned NOT NULL DEFAULT 0,
  `action_type` varchar(255) DEFAULT NULL,
  `field` varchar(255) DEFAULT NULL,
  `value` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `rules_id` (`rules_id`),
  KEY `field_value` (`field`(50),`value`(50))
) ENGINE=InnoDB AUTO_INCREMENT=92 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_ruleactions` DISABLE KEYS */;
INSERT INTO `glpi_ruleactions` VALUES
(1,1,'assign','_ignore_import','1'),
(2,2,'assign','_inventory','0'),
(3,3,'assign','_inventory','0'),
(4,4,'assign','_inventory','0'),
(5,5,'assign','_inventory','0'),
(6,6,'assign','_inventory','0'),
(7,7,'assign','_inventory','0'),
(8,8,'assign','_inventory','0'),
(9,9,'assign','_inventory','0'),
(10,10,'assign','_ignore_import','1'),
(11,11,'assign','_inventory','0'),
(12,12,'assign','_inventory','0'),
(13,13,'assign','_inventory','0'),
(14,14,'assign','_inventory','0'),
(15,15,'assign','_inventory','0'),
(16,16,'assign','_inventory','0'),
(17,17,'assign','_inventory','0'),
(18,18,'assign','_inventory','0'),
(19,19,'assign','_inventory','0'),
(20,20,'assign','_inventory','0'),
(21,21,'assign','_inventory','0'),
(22,22,'assign','_ignore_import','1'),
(23,23,'assign','_ignore_import','1'),
(24,24,'assign','_inventory','0'),
(25,25,'assign','_inventory','0'),
(26,26,'assign','_inventory','0'),
(27,27,'assign','_inventory','0'),
(28,28,'assign','_ignore_import','1'),
(29,29,'assign','_ignore_import','1'),
(30,30,'assign','_inventory','0'),
(31,31,'assign','_inventory','0'),
(32,32,'assign','_inventory','0'),
(33,33,'assign','_inventory','0'),
(34,34,'assign','_ignore_import','1'),
(35,35,'assign','_inventory','0'),
(36,36,'assign','_inventory','0'),
(37,37,'assign','_ignore_import','1'),
(38,38,'assign','_inventory','0'),
(39,39,'assign','_inventory','0'),
(40,40,'assign','_ignore_import','1'),
(41,41,'assign','_ignore_import','1'),
(42,42,'assign','_inventory','0'),
(43,43,'assign','_inventory','0'),
(44,44,'assign','_inventory','0'),
(45,45,'assign','_inventory','0'),
(46,46,'assign','_inventory','0'),
(47,47,'assign','_inventory','0'),
(48,48,'assign','_inventory','0'),
(49,49,'assign','_inventory','0'),
(50,50,'assign','_inventory','0'),
(51,51,'assign','_inventory','0'),
(52,52,'assign','_inventory','0'),
(53,53,'assign','_ignore_import','1'),
(54,54,'assign','_inventory','0'),
(55,55,'assign','_inventory','0'),
(56,56,'assign','_ignore_import','1'),
(57,57,'assign','_inventory','0'),
(58,58,'assign','_inventory','0'),
(59,59,'assign','_ignore_import','1'),
(60,60,'assign','_ignore_import','1'),
(61,61,'assign','_inventory','0'),
(62,62,'assign','_inventory','0'),
(63,63,'assign','_inventory','0'),
(64,64,'assign','_inventory','0'),
(65,65,'assign','_ignore_import','1'),
(66,66,'assign','_inventory','0'),
(67,67,'assign','_inventory','0'),
(68,68,'assign','_ignore_import','1'),
(69,69,'assign','_inventory','0'),
(70,70,'assign','_inventory','0'),
(71,71,'assign','_ignore_import','1'),
(72,72,'assign','_refuse_email_no_response','1'),
(73,73,'assign','_refuse_email_no_response','1'),
(74,74,'assign','_refuse_email_no_response','1'),
(75,75,'assign','entities_id','0'),
(76,76,'assign','entities_id','0'),
(77,77,'assign','_import_category','1'),
(78,78,'fromitem','locations_id','1'),
(79,79,'fromuser','locations_id','1'),
(80,80,'regex_result','_affect_user_by_regex','#0'),
(81,81,'regex_result','_affect_user_by_regex','#0'),
(82,82,'regex_result','_affect_user_by_regex','#0'),
(83,83,'append_regex_result','name','#0'),
(84,84,'append_regex_result','name','#1'),
(85,85,'append_regex_result','name','#1 #2'),
(86,86,'append_regex_result','name','#1'),
(87,87,'append_regex_result','name','#2'),
(88,88,'append_regex_result','name','#3'),
(89,89,'append_regex_result','name','#2'),
(90,90,'append_regex_result','name','#4'),
(91,91,'append_regex_result','name','#4');
/*!40000 ALTER TABLE `glpi_ruleactions` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_rulecriterias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_rulecriterias` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `rules_id` int(10) unsigned NOT NULL DEFAULT 0,
  `criteria` varchar(255) DEFAULT NULL,
  `condition` int(11) NOT NULL DEFAULT 0,
  `pattern` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `rules_id` (`rules_id`),
  KEY `condition` (`condition`)
) ENGINE=InnoDB AUTO_INCREMENT=208 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_rulecriterias` DISABLE KEYS */;
INSERT INTO `glpi_rulecriterias` VALUES
(1,1,'partial',0,'1'),
(2,1,'itemtype',9,'1'),
(3,2,'itemtype',9,'1'),
(4,2,'mac',10,'1'),
(5,2,'mac',8,'1'),
(6,2,'ifnumber',10,'1'),
(7,2,'ifnumber',8,'1'),
(8,2,'link_criteria_port',203,'1'),
(9,3,'itemtype',9,'1'),
(10,3,'mac',10,'1'),
(11,3,'mac',8,'1'),
(12,3,'ifnumber',10,'1'),
(13,3,'ifnumber',8,'1'),
(14,4,'itemtype',9,'1'),
(15,4,'mac',8,'1'),
(16,4,'ifnumber',8,'1'),
(17,5,'itemtype',9,'1'),
(18,5,'ip',10,'1'),
(19,5,'ip',8,'1'),
(20,5,'ifdescr',10,'1'),
(21,5,'ifdescr',8,'1'),
(22,5,'link_criteria_port',203,'1'),
(23,6,'itemtype',9,'1'),
(24,6,'ip',10,'1'),
(25,6,'ip',8,'1'),
(26,6,'ifdescr',10,'1'),
(27,6,'ifdescr',8,'1'),
(28,7,'itemtype',9,'1'),
(29,7,'ip',8,'1'),
(30,7,'ifdescr',8,'1'),
(31,8,'itemtype',9,'1'),
(32,8,'mac',10,'1'),
(33,8,'mac',8,'1'),
(34,8,'only_these_criteria',204,'1'),
(35,9,'itemtype',9,'1'),
(36,9,'mac',8,'1'),
(37,9,'only_these_criteria',204,'1'),
(38,10,'itemtype',0,'Computer'),
(39,10,'name',9,'1'),
(40,11,'itemtype',0,'Computer'),
(41,11,'serial',10,'1'),
(42,11,'serial',8,'1'),
(43,11,'uuid',10,'1'),
(44,11,'uuid',8,'1'),
(45,12,'itemtype',0,'Computer'),
(46,12,'serial',10,'1'),
(47,12,'serial',8,'1'),
(48,12,'uuid',30,'1'),
(49,13,'itemtype',0,'Computer'),
(50,13,'uuid',8,'1'),
(51,13,'serial',8,'1'),
(52,14,'itemtype',0,'Computer'),
(53,14,'serial',10,'1'),
(54,14,'serial',8,'1'),
(55,15,'itemtype',0,'Computer'),
(56,15,'uuid',10,'1'),
(57,15,'uuid',8,'1'),
(58,16,'itemtype',0,'Computer'),
(59,16,'mac',10,'1'),
(60,16,'mac',8,'1'),
(61,17,'itemtype',0,'Computer'),
(62,17,'name',10,'1'),
(63,17,'name',8,'1'),
(64,18,'itemtype',0,'Computer'),
(65,18,'serial',8,'1'),
(66,19,'itemtype',0,'Computer'),
(67,19,'uuid',8,'1'),
(68,20,'itemtype',0,'Computer'),
(69,20,'mac',8,'1'),
(70,21,'itemtype',0,'Computer'),
(71,21,'name',8,'1'),
(72,22,'itemtype',0,'Computer'),
(73,23,'itemtype',0,'Printer'),
(74,23,'name',9,'1'),
(75,24,'itemtype',0,'Printer'),
(76,24,'serial',8,'1'),
(77,24,'serial',10,'1'),
(78,25,'itemtype',0,'Printer'),
(79,25,'mac',8,'1'),
(80,25,'mac',10,'1'),
(81,26,'itemtype',0,'Printer'),
(82,26,'serial',8,'1'),
(83,27,'itemtype',0,'Printer'),
(84,27,'mac',8,'1'),
(85,28,'itemtype',0,'Printer'),
(86,29,'itemtype',0,'NetworkEquipment'),
(87,29,'name',9,'1'),
(88,30,'itemtype',0,'NetworkEquipment'),
(89,30,'serial',8,'1'),
(90,30,'serial',10,'1'),
(91,31,'itemtype',0,'NetworkEquipment'),
(92,31,'mac',8,'1'),
(93,31,'mac',10,'1'),
(94,32,'itemtype',0,'NetworkEquipment'),
(95,32,'serial',8,'1'),
(96,33,'itemtype',0,'NetworkEquipment'),
(97,33,'mac',8,'1'),
(98,34,'itemtype',0,'NetworkEquipment'),
(99,35,'itemtype',0,'Peripheral'),
(100,35,'serial',8,'1'),
(101,35,'serial',10,'1'),
(102,36,'itemtype',0,'Peripheral'),
(103,36,'serial',8,'1'),
(104,37,'itemtype',0,'Peripheral'),
(105,38,'itemtype',0,'Monitor'),
(106,38,'serial',8,'1'),
(107,38,'serial',10,'1'),
(108,39,'itemtype',0,'Monitor'),
(109,39,'serial',8,'1'),
(110,40,'itemtype',0,'Monitor'),
(111,41,'itemtype',0,'Phone'),
(112,41,'name',9,'1'),
(113,42,'itemtype',0,'Phone'),
(114,42,'serial',10,'1'),
(115,42,'serial',8,'1'),
(116,42,'uuid',10,'1'),
(117,42,'uuid',8,'1'),
(118,43,'itemtype',0,'Phone'),
(119,43,'serial',10,'1'),
(120,43,'serial',8,'1'),
(121,43,'uuid',30,'1'),
(122,44,'itemtype',0,'Phone'),
(123,44,'uuid',8,'1'),
(124,44,'serial',8,'1'),
(125,45,'itemtype',0,'Phone'),
(126,45,'serial',10,'1'),
(127,45,'serial',8,'1'),
(128,46,'itemtype',0,'Phone'),
(129,46,'uuid',10,'1'),
(130,46,'uuid',8,'1'),
(131,47,'itemtype',0,'Phone'),
(132,47,'mac',10,'1'),
(133,47,'mac',8,'1'),
(134,48,'itemtype',0,'Phone'),
(135,48,'name',10,'1'),
(136,48,'name',8,'1'),
(137,49,'itemtype',0,'Phone'),
(138,49,'serial',8,'1'),
(139,50,'itemtype',0,'Phone'),
(140,50,'uuid',8,'1'),
(141,51,'itemtype',0,'Phone'),
(142,51,'mac',8,'1'),
(143,52,'itemtype',0,'Phone'),
(144,52,'name',8,'1'),
(145,53,'itemtype',0,'Phone'),
(146,54,'itemtype',0,'Cluster'),
(147,54,'uuid',8,'1'),
(148,54,'uuid',10,'1'),
(149,55,'itemtype',0,'Cluster'),
(150,55,'uuid',8,'1'),
(151,56,'itemtype',0,'Cluster'),
(152,57,'itemtype',0,'Enclosure'),
(153,57,'serial',8,'1'),
(154,57,'serial',10,'1'),
(155,58,'itemtype',0,'Enclosure'),
(156,58,'serial',8,'1'),
(157,59,'itemtype',0,'Enclosure'),
(158,60,'name',9,'1'),
(159,61,'serial',8,'1'),
(160,61,'serial',10,'1'),
(161,62,'mac',8,'1'),
(162,62,'mac',10,'1'),
(163,63,'serial',8,'1'),
(164,64,'mac',8,'1'),
(165,65,'itemtype',0,''),
(166,66,'itemtype',0,'DatabaseInstance'),
(167,66,'name',8,'1'),
(168,66,'name',10,'1'),
(169,66,'linked_item',10,'1'),
(170,67,'itemtype',0,'DatabaseInstance'),
(171,67,'name',8,'1'),
(172,68,'itemtype',0,'DatabaseInstance'),
(173,69,'itemtype',0,'Unmanaged'),
(174,69,'name',8,'1'),
(175,69,'name',10,'1'),
(176,70,'itemtype',0,'Unmanaged'),
(177,70,'name',8,'1'),
(178,71,'itemtype',0,'Unmanaged'),
(179,72,'message_id',6,'/GLPI(_(?<uuid>[a-z0-9]+))?(-(?<itemtype>[a-z]+))?(-(?<items_id>[0-9]+))?(\\/(?<event>[a-z_]+))?(\\.(?<random>[0-9]+\\.[0-9]+))?@(?<uname>.+)/i'),
(180,73,'x-auto-response-suppress',6,'/\\S+/'),
(181,74,'auto-submitted',6,'/^(?!.*no).+$/i'),
(182,75,'subject',6,'/.*/'),
(183,76,'TYPE',0,'3'),
(184,76,'TYPE',0,'2'),
(185,77,'name',0,'*'),
(186,78,'locations_id',9,'1'),
(187,78,'_locations_id_of_item',8,'1'),
(188,79,'locations_id',9,'1'),
(189,79,'_locations_id_of_requester',8,'1'),
(190,80,'_itemtype',0,'Computer'),
(191,80,'_auto',0,'1'),
(192,80,'contact',6,'/(.*)@/'),
(193,81,'_itemtype',0,'Computer'),
(194,81,'_auto',0,'1'),
(195,81,'contact',6,'/(.*)[,|\\/]/'),
(196,82,'_itemtype',0,'Computer'),
(197,82,'_auto',0,'1'),
(198,82,'contact',6,'/(.*)/'),
(199,83,'name',6,'/(SUSE|SunOS|Red Hat|CentOS|Ubuntu|Debian|Fedora|AlmaLinux|Oracle|Amazon Linux)(?:\\D+|)([\\d.]*) ?(?:\\(?([\\w ]+)\\)?)?/'),
(200,84,'name',6,'/(Microsoft)(?>\\(R\\)|®)? (Windows) (XP|\\d\\.\\d|\\d{1,4}|Vista)(™)? ?(.*)/'),
(201,85,'name',6,'/(Microsoft)(?>\\(R\\)|®)? (?:(Hyper-V|Windows)(?:\\(R\\))?) ((?:Server|))(?:\\(R\\)|®)? (\\d{4}(?: R2)?)(?:[,\\s]++)?([^\\s]*)(?: Edition(?: x64)?)?$/'),
(202,86,'os_name',6,'/(SUSE|SunOS|Red Hat|CentOS|Ubuntu|Debian|Fedora|AlmaLinux|Oracle)(?:\\D+|)([\\d.]+) ?(?:\\(?([\\w ]+)\\)?)?/'),
(203,87,'os_name',6,'/(Microsoft)(?>\\(R\\)|®)? (Windows) (XP|\\d\\.\\d|\\d{1,4}|Vista)(™)? ?(.*)/'),
(204,88,'os_name',6,'/(Microsoft)(?>\\(R\\)|®)? (?:(Hyper-V|Windows)(?:\\(R\\))?) ((?:Server|))(?:\\(R\\)|®)? (\\d{4}(?: R2)?)(?:[,\\s]++)?([^\\s]*)(?: Edition(?: x64)?)?$/'),
(205,89,'os_name',6,'/(SUSE|SunOS|Red Hat|CentOS|Ubuntu|Debian|Fedora|AlmaLinux|Oracle)(?:\\D+|)([\\d.]+) ?(?:\\(?([\\w ]+)\\)?)?/'),
(206,90,'os_name',6,'/(Microsoft)(?>\\(R\\)|®)? (Windows) (XP|\\d\\.\\d|\\d{1,4}|Vista)(™)? ?(.*)/'),
(207,91,'os_name',6,'/(Microsoft)(?>\\(R\\)|®)? (?:(Hyper-V|Windows)(?:\\(R\\))?) ((?:Server|))(?:\\(R\\)|®)? (\\d{4}(?: R2)?)(?:[,\\s]++)?([^\\s]*)(?: Edition(?: x64)?)?$/');
/*!40000 ALTER TABLE `glpi_rulecriterias` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_rulematchedlogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_rulematchedlogs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `date` timestamp NULL DEFAULT NULL,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(100) DEFAULT NULL,
  `rules_id` int(10) unsigned DEFAULT NULL,
  `agents_id` int(10) unsigned NOT NULL DEFAULT 0,
  `method` varchar(255) DEFAULT NULL,
  `input` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `agents_id` (`agents_id`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `rules_id` (`rules_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_rulematchedlogs` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_rulematchedlogs` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_rulerightparameters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_rulerightparameters` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `value` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_rulerightparameters` DISABLE KEYS */;
INSERT INTO `glpi_rulerightparameters` VALUES
(1,'(LDAP)Organization','o',NULL,NULL,NULL),
(2,'(LDAP)Common Name','cn',NULL,NULL,NULL),
(3,'(LDAP)Department Number','departmentnumber',NULL,NULL,NULL),
(4,'(LDAP)Email','mail',NULL,NULL,NULL),
(5,'Object Class','objectclass',NULL,NULL,NULL),
(6,'(LDAP)User ID','uid',NULL,NULL,NULL),
(7,'(LDAP)Telephone Number','phone',NULL,NULL,NULL),
(8,'(LDAP)Employee Number','employeenumber',NULL,NULL,NULL),
(9,'(LDAP)Manager','manager',NULL,NULL,NULL),
(10,'(LDAP)DistinguishedName','dn',NULL,NULL,NULL),
(12,'(AD)User ID','samaccountname',NULL,NULL,NULL),
(13,'(LDAP) Title','title',NULL,NULL,NULL),
(14,'(LDAP) MemberOf','memberof',NULL,NULL,NULL);
/*!40000 ALTER TABLE `glpi_rulerightparameters` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_rules` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `sub_type` varchar(255) NOT NULL DEFAULT '',
  `ranking` int(11) NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `match` char(10) DEFAULT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT 1,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `uuid` varchar(255) DEFAULT NULL,
  `condition` int(11) NOT NULL DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_active` (`is_active`),
  KEY `sub_type` (`sub_type`),
  KEY `date_mod` (`date_mod`),
  KEY `is_recursive` (`is_recursive`),
  KEY `condition` (`condition`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB AUTO_INCREMENT=92 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_rules` DISABLE KEYS */;
INSERT INTO `glpi_rules` VALUES
(1,0,'RuleImportAsset',1,'No creation on partial import','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_no_creation_on_partial_import',0,'2026-10-13 17:00:52'),
(2,0,'RuleImportAsset',2,'Global update (by mac+ifnumber restricted port)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_global_update_mac_ifnumber_restricted_port',0,'2026-10-13 17:00:52'),
(3,0,'RuleImportAsset',3,'Global update (by mac+ifnumber not restricted port)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_global_update_mac_ifnumber_no_restricted_port',0,'2026-10-13 17:00:52'),
(4,0,'RuleImportAsset',4,'Global import (by mac+ifnumber)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_global_import_mac_ifnumber',0,'2026-10-13 17:00:52'),
(5,0,'RuleImportAsset',5,'Global update (by ip+ifdescr restricted port)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_global_update_mac_ifdescr_restricted_port',0,'2026-10-13 17:00:52'),
(6,0,'RuleImportAsset',6,'Global update (by ip+ifdescr not restricted port)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_global_update_ip_ifdescr_no_restricted_port',0,'2026-10-13 17:00:52'),
(7,0,'RuleImportAsset',7,'Global import (by ip+ifdescr)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_global_import_ip_ifdescr',0,'2026-10-13 17:00:52'),
(8,0,'RuleImportAsset',8,'Update only mac address (mac on switch port)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_update_only_mac_adress',0,'2026-10-13 17:00:52'),
(9,0,'RuleImportAsset',9,'Import only mac address (mac on switch port)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_import_only_mac_adress',0,'2026-10-13 17:00:52'),
(10,0,'RuleImportAsset',10,'Computer constraint (name)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_computer_constraint_name',0,'2026-10-13 17:00:52'),
(11,0,'RuleImportAsset',11,'Computer update (by serial + uuid)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_computer_update_serial_uuid',0,'2026-10-13 17:00:52'),
(12,0,'RuleImportAsset',12,'Computer update (by serial + uuid is empty in GLPI)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_computer_update_serial_uuid_empty',0,'2026-10-13 17:00:52'),
(13,0,'RuleImportAsset',13,'Computer import (by serial + uuid)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_computer_import_serial_uuid',0,'2026-10-13 17:00:52'),
(14,0,'RuleImportAsset',14,'Computer update (by serial)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_computer_update_serial',0,'2026-10-13 17:00:52'),
(15,0,'RuleImportAsset',15,'Computer update (by uuid)','','AND',0,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_computer_update_uuid',0,'2026-10-13 17:00:52'),
(16,0,'RuleImportAsset',16,'Computer update (by mac)','','AND',0,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_computer_update_mac',0,'2026-10-13 17:00:52'),
(17,0,'RuleImportAsset',17,'Computer update (by name)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_computer_update_name',0,'2026-10-13 17:00:52'),
(18,0,'RuleImportAsset',18,'Computer import (by serial)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_computer_import_serial',0,'2026-10-13 17:00:52'),
(19,0,'RuleImportAsset',19,'Computer import (by uuid)','','AND',0,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_computer_import_uuid',0,'2026-10-13 17:00:52'),
(20,0,'RuleImportAsset',20,'Computer import (by mac)','','AND',0,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_computer_import_mac',0,'2026-10-13 17:00:52'),
(21,0,'RuleImportAsset',21,'Computer import (by name)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_computer_import_name',0,'2026-10-13 17:00:52'),
(22,0,'RuleImportAsset',22,'Computer import denied','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_computer_import_denied',0,'2026-10-13 17:00:52'),
(23,0,'RuleImportAsset',23,'Printer constraint (name)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_printer_constraint_name',0,'2026-10-13 17:00:52'),
(24,0,'RuleImportAsset',24,'Printer update (by serial)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_printer_update_serial',0,'2026-10-13 17:00:52'),
(25,0,'RuleImportAsset',25,'Printer update (by mac)','','AND',0,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_printer_update_mac',0,'2026-10-13 17:00:52'),
(26,0,'RuleImportAsset',26,'Printer import (by serial)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_printer_import_serial',0,'2026-10-13 17:00:52'),
(27,0,'RuleImportAsset',27,'Printer import (by mac)','','AND',0,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_printer_import_mac',0,'2026-10-13 17:00:52'),
(28,0,'RuleImportAsset',28,'Printer import denied','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_printer_import_denied',0,'2026-10-13 17:00:52'),
(29,0,'RuleImportAsset',29,'NetworkEquipment constraint (name)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_networkequipment_constraint_name',0,'2026-10-13 17:00:52'),
(30,0,'RuleImportAsset',30,'NetworkEquipment update (by serial)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_networkequipment_update_serial',0,'2026-10-13 17:00:52'),
(31,0,'RuleImportAsset',31,'NetworkEquipment update (by mac)','','AND',0,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_networkequipment_update_mac',0,'2026-10-13 17:00:52'),
(32,0,'RuleImportAsset',32,'NetworkEquipment import (by serial)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_networkequipment_import_serial',0,'2026-10-13 17:00:52'),
(33,0,'RuleImportAsset',33,'NetworkEquipment import (by mac)','','AND',0,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_networkequipment_import_mac',0,'2026-10-13 17:00:52'),
(34,0,'RuleImportAsset',34,'NetworkEquipment import denied','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_networkequipment_import_denied',0,'2026-10-13 17:00:52'),
(35,0,'RuleImportAsset',35,'Device update (by serial)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_device_update_serial',0,'2026-10-13 17:00:52'),
(36,0,'RuleImportAsset',36,'Device import (by serial)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_device_importe_serial',0,'2026-10-13 17:00:52'),
(37,0,'RuleImportAsset',37,'Device import denied','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_device_import_denied',0,'2026-10-13 17:00:52'),
(38,0,'RuleImportAsset',38,'Monitor update (by serial)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_monitor_update_serial',0,'2026-10-13 17:00:52'),
(39,0,'RuleImportAsset',39,'Monitor import (by serial)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_monitor_import_serial',0,'2026-10-13 17:00:52'),
(40,0,'RuleImportAsset',40,'Monitor import denied','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_monitor_import_denied',0,'2026-10-13 17:00:52'),
(41,0,'RuleImportAsset',41,'Phone constraint (name)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_phone_constraint_name',0,'2026-10-13 17:00:52'),
(42,0,'RuleImportAsset',42,'Phone update (by serial + uuid)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_phone_update_serial_uuid',0,'2026-10-13 17:00:52'),
(43,0,'RuleImportAsset',43,'Phone update (by serial + uuid is empty in GLPI)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_phone_update_serial_uuid_empty',0,'2026-10-13 17:00:52'),
(44,0,'RuleImportAsset',44,'Phone import (by serial + uuid)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_phone_import_serial_uuid',0,'2026-10-13 17:00:52'),
(45,0,'RuleImportAsset',45,'Phone update (by serial)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_phone_update_serial',0,'2026-10-13 17:00:52'),
(46,0,'RuleImportAsset',46,'Phone update (by uuid)','','AND',0,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_phone_update_uuid',0,'2026-10-13 17:00:52'),
(47,0,'RuleImportAsset',47,'Phone update (by mac)','','AND',0,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_phone_update_mac',0,'2026-10-13 17:00:52'),
(48,0,'RuleImportAsset',48,'Phone update (by name)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_phone_update_name',0,'2026-10-13 17:00:52'),
(49,0,'RuleImportAsset',49,'Phone import (by serial)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_phone_import_serial',0,'2026-10-13 17:00:52'),
(50,0,'RuleImportAsset',50,'Phone import (by uuid)','','AND',0,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_phone_import_uuid',0,'2026-10-13 17:00:52'),
(51,0,'RuleImportAsset',51,'Phone import (by mac)','','AND',0,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_phone_import_mac',0,'2026-10-13 17:00:52'),
(52,0,'RuleImportAsset',52,'Phone import (by name)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_phone_import_name',0,'2026-10-13 17:00:52'),
(53,0,'RuleImportAsset',53,'Phone import denied','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_phone_import_denied',0,'2026-10-13 17:00:52'),
(54,0,'RuleImportAsset',54,'Cluster update (by uuid)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_cluster_update_uuid',0,'2026-10-13 17:00:52'),
(55,0,'RuleImportAsset',55,'Cluster import (by uuid)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_cluster_import_uuid',0,'2026-10-13 17:00:52'),
(56,0,'RuleImportAsset',56,'Cluster import denied','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_cluster_import_denied',0,'2026-10-13 17:00:52'),
(57,0,'RuleImportAsset',57,'Enclosure update (by serial)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_enclosure_update_serial',0,'2026-10-13 17:00:52'),
(58,0,'RuleImportAsset',58,'Enclosure import (by serial)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_enclosure_import_serial',0,'2026-10-13 17:00:52'),
(59,0,'RuleImportAsset',59,'Enclosure import denied','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_enclosure_import_denied',0,'2026-10-13 17:00:52'),
(60,0,'RuleImportAsset',60,'Global constraint (name)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_global_constraint_name',0,'2026-10-13 17:00:52'),
(61,0,'RuleImportAsset',61,'Global update (by serial)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_global_update_serial',0,'2026-10-13 17:00:52'),
(62,0,'RuleImportAsset',62,'Global update (by mac)','','AND',0,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_global_update_mac',0,'2026-10-13 17:00:52'),
(63,0,'RuleImportAsset',63,'Global import (by serial)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_global_import_serial',0,'2026-10-13 17:00:52'),
(64,0,'RuleImportAsset',64,'Global import (by mac)','','AND',0,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_global_import_mac',0,'2026-10-13 17:00:52'),
(65,0,'RuleImportAsset',65,'Global import denied','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_global_import_denied',0,'2026-10-13 17:00:52'),
(66,0,'RuleImportAsset',66,'Database update (by name)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_database_update_name',0,'2026-10-13 17:00:52'),
(67,0,'RuleImportAsset',67,'Database import (by name)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_database_import_name',0,'2026-10-13 17:00:52'),
(68,0,'RuleImportAsset',68,'Database import denied','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_database_import_denied',0,'2026-10-13 17:00:52'),
(69,0,'RuleImportAsset',69,'Unmanaged update (by name)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_unmanaged_update_name',0,'2026-10-13 17:00:52'),
(70,0,'RuleImportAsset',70,'Unmanaged import (by name)','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_unmanaged_import_name',0,'2026-10-13 17:00:52'),
(71,0,'RuleImportAsset',71,'Unmanaged import denied','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_import_asset_unmanaged_import_denied',0,'2026-10-13 17:00:52'),
(72,0,'RuleMailCollector',1,'GLPI notifications','Exclude emails corresponding to a GLPI notification','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_mail_collector_glpi_notifications',0,'2026-10-13 17:00:52'),
(73,0,'RuleMailCollector',2,'X-Auto-Response-Suppress','Exclude Auto-Reply emails using X-Auto-Response-Suppress header','AND',0,'','2026-10-13 17:00:52',1,'glpi_rule_mail_collector_x_auto_response_suppress',0,'2026-10-13 17:00:52'),
(74,0,'RuleMailCollector',3,'Auto-Reply Auto-Submitted','Exclude Auto-Reply emails using Auto-Submitted header','OR',1,'','2026-10-13 17:00:52',1,'glpi_rule_mail_collector_auto_reply_auto_submitted',0,'2026-10-13 17:00:52'),
(75,0,'RuleMailCollector',4,'Root','','OR',1,'','2026-10-13 17:00:52',0,'glpi_rule_mail_collector_root',0,'2026-10-13 17:00:52'),
(76,0,'RuleRight',1,'Root','','OR',1,'','2026-10-13 17:00:52',0,'glpi_rule_right_root',0,'2026-10-13 17:00:52'),
(77,0,'RuleSoftwareCategory',1,'Import category from inventory tool','','AND',0,'','2026-10-13 17:00:52',1,'glpi_rule_rule_software_category_import_category_from_inventory_tool',1,'2026-10-13 17:00:52'),
(78,0,'RuleTicket',1,'Ticket location from item','','AND',0,'','2026-10-13 17:00:52',1,'glpi_rule_rule_ticket_location_from_item',1,'2026-10-13 17:00:52'),
(79,0,'RuleTicket',2,'Ticket location from user','','AND',0,'','2026-10-13 17:00:52',1,'glpi_rule_rule_ticket_location_from_user',1,'2026-10-13 17:00:52'),
(80,0,'RuleAsset',1,'Domain user assignation','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_rule_asset_domain_user_assignation',3,'2026-10-13 17:00:52'),
(81,0,'RuleAsset',2,'Multiple users: assign to the first','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_rule_asset_multiple_user_assign_to_first',3,'2026-10-13 17:00:52'),
(82,0,'RuleAsset',3,'One user assignation','','AND',1,'','2026-10-13 17:00:52',1,'glpi_rule_rule_asset_one_user_assignation',3,'2026-10-13 17:00:52'),
(83,0,'RuleDictionnaryOperatingSystem',1,'Clean Linux OS Name','','AND',0,'/(SUSE|SunOS|Red Hat|CentOS|Ubuntu|Debian|Fedora|AlmaLinux|Oracle|Amazon Linux)(?:\\D+|)([\\d.]*) ?(?:\\(?([\\w ]+)\\)?)?/\n\n            Example :\n            Ubuntu 22.04.1 LTS -> #0 = Ubuntu\n            SUSE Linux Enterprise Server 11 (x86_64)  ->#0 = SUSE\n            SunOS -> #0 = SunOS\n            Red Hat Enterprise Linux Server release 7.9 (Maipo) -> #0 = Red Hat\n            Oracle Linux Server release 7.3 -> #0 = Oracle\n            Fedora release 36 (Thirty Six) -> #0 = Fedora\n            Debian GNU/Linux 9.5 (stretch) -> #0 = Debian\n            CentOS Stream release 8 -> #0 = CentOS\n            AlmaLinux 9.0 (Emerald Puma) -> #0 = AlmaLinux\n            Amazon Linux 2023 -> #0 = Amazon Linux','2026-10-13 17:00:52',1,'clean_linux_os_name',0,'2026-10-13 17:00:52'),
(84,0,'RuleDictionnaryOperatingSystem',2,'Clean Windows OS Name','','AND',0,'/(Microsoft)(?>\\(R\\)|®)? (Windows) (XP|\\d\\.\\d|\\d{1,4}|Vista)(™)? ?(.*)/\n\n            Example :\n            Microsoft Windows XP Professionnel -> #1 : Windows\n            Microsoft Windows 7 Enterprise  -> #1 : Windows\n            Microsoft® Windows Vista Professionnel  -> #1 : Windows\n            Microsoft Windows XP Édition familiale  -> #1 : Windows\n            Microsoft Windows 10 Entreprise  -> #1 : Windows\n            Microsoft Windows 10 Professionnel  -> #1 : Windows\n            Microsoft Windows 11 Professionnel  -> #1 : Windows','2026-10-13 17:00:52',1,'clean_windows_os_name',0,'2026-10-13 17:00:52'),
(85,0,'RuleDictionnaryOperatingSystem',3,'Clean Windows Server OS Name','','AND',0,'/(Microsoft)(?>\\(R\\)|®)? (?:(Hyper-V|Windows)(?:\\(R\\))?) ((?:Server|))(?:\\(R\\)|®)? (\\d{4}(?: R2)?)(?:[,\\s]++)?([^\\s]*)(?: Edition(?: x64)?)?$/\n\n            Example :\n            Microsoft Windows Server 2012 R2 Datacenter -> #1 #2 : Windows Server\n            Microsoft(R) Windows(R) Server 2003, Standard Edition x64 -> #1 #2 : Windows Server\n            Microsoft Hyper-V Server 2012 R2 -> #1 #2 : Hyper-V Server\n            Microsoft® Windows Server® 2008 Standard -> #1 #2 : Windows Server','2026-10-13 17:00:52',1,'clean_windows_server_os_name',0,'2026-10-13 17:00:52'),
(86,0,'RuleDictionnaryOperatingSystemVersion',1,'Clean Linux OS Version','','AND',0,'/(SUSE|SunOS|Red Hat|CentOS|Ubuntu|Debian|Fedora|AlmaLinux|Oracle)(?:\\D+|)([\\d.]+) ?(?:\\(?([\\w ]+)\\)?)?/\n\n            Example :\n            Ubuntu 22.04.1 LTS -> #1 = 22.04.1\n            SUSE Linux Enterprise Server 11 (x86_64) -> #1 =  11\n            SunOS 5.10 -> #1 = 5.10\n            Red Hat Enterprise Linux Server release 7.9 (Maipo) -> #1 = 7.9\n            Oracle Linux Server release 7.3 -> #1 = 7.3\n            Fedora release 36 (Thirty Six) -> #1 =  36\n            Debian GNU/Linux 9.5 (stretch) -> #1 = 9.5\n            CentOS release 6.9 (Final) -> #1 = 6.9\n            AlmaLinux 9.0 (Emerald Puma) -> #1 = 9.0','2026-10-13 17:00:52',1,'clean_linux_os_version',0,'2026-10-13 17:00:52'),
(87,0,'RuleDictionnaryOperatingSystemVersion',2,'Clean Windows OS Version','','AND',0,'/(Microsoft)(?>\\(R\\)|®)? (Windows) (XP|\\d\\.\\d|\\d{1,4}|Vista)(™)? ?(.*)/\n\n            Example :\n            Microsoft Windows XP Professionnel -> #2 : XP\n            Microsoft Windows 7 Enterprise  -> #2 : 7\n            Microsoft® Windows Vista Professionnel  -> #2 : Vista\n            Microsoft Windows XP Édition familiale  -> #2 : XP\n            Microsoft Windows 10 Entreprise  -> #2 : 10\n            Microsoft Windows 10 Professionnel  -> #2 : 10\n            Microsoft Windows 11 Professionnel  -> #2 : 11','2026-10-13 17:00:52',1,'clean_windows_os_version',0,'2026-10-13 17:00:52'),
(88,0,'RuleDictionnaryOperatingSystemVersion',3,'Clean Windows Server OS Version','','AND',0,'/(Microsoft)(?>\\(R\\)|®)? (?:(Hyper-V|Windows)(?:\\(R\\))?) ((?:Server|))(?:\\(R\\)|®)? (\\d{4}(?: R2)?)(?:[,\\s]++)?([^\\s]*)(?: Edition(?: x64)?)?$/\n\n            Example :\n            Microsoft Windows Server 2012 R2 Datacenter -> #3 : 2012 R2\n            Microsoft(R) Windows(R) Server 2003, Standard Edition x64 -> #3 : 2003\n            Microsoft Hyper-V Server 2012 R2 -> #3 : 2012 R2\n            Microsoft® Windows Server® 2008 Standard -> #3 : 2008','2026-10-13 17:00:52',1,'clean_windows_server_os_version',0,'2026-10-13 17:00:52'),
(89,0,'RuleDictionnaryOperatingSystemEdition',1,'Clean Linux OS Edition','','AND',0,'/(SUSE|SunOS|Red Hat|CentOS|Ubuntu|Debian|Fedora|AlmaLinux|Oracle)(?:\\D+|)([\\d.]+) ?(?:\\(?([\\w ]+)\\)?)?/\n\n        Example :\n        Ubuntu 22.04.1 LTS -> #2 = LTS\n        SUSE Linux Enterprise Server 11 (x86_64) -> #2 = x86_64\n        Red Hat Enterprise Linux Server release 7.9 (Maipo) -> #2 = Maipo\n        Red Hat Enterprise Linux Server release 6.10 (Santiago) -> #2 = Santiago\n        Fedora release 36 (Thirty Six) -> #2 = Thirty Six\n        Debian GNU/Linux 9.5 (stretch) -> #2 = stretch\n        Debian GNU/Linux 8.9 (jessie) -> #2 = jessie\n        CentOS Linux release 7.2.1511 (Core) -> #2 = Core\n        AlmaLinux 9.0 (Emerald Puma) -> #2 = Emerald Puma\n        AlmaLinux 8.6 (Sky Tiger) -> #2 = Sky Tiger','2026-10-13 17:00:52',1,'clean_linux_os_edition',0,'2026-10-13 17:00:52'),
(90,0,'RuleDictionnaryOperatingSystemEdition',2,'Clean Windows OS Edition','','AND',0,'/(Microsoft)(?>\\(R\\)|®)? (Windows) (XP|\\d\\.\\d|\\d{1,4}|Vista)(™)? ?(.*)/\n\n        Example :\n        Microsoft Windows XP Professionnel -> #4 : Professionnel\n        Microsoft Windows 7 Enterprise  -> #4 : Enterprise\n        Microsoft® Windows Vista Professionnel  -> #4 : Professionnel\n        Microsoft Windows XP Édition familiale  -> #4 : Édition familiale\n        Microsoft Windows 10 Entreprise  -> #4 : Entreprise\n        Microsoft Windows 10 Professionnel  -> #4 : Professionnel\n        Microsoft Windows 11 Professionnel  -> #4 : Professionnel','2026-10-13 17:00:52',1,'clean_windows_os_edition',0,'2026-10-13 17:00:52'),
(91,0,'RuleDictionnaryOperatingSystemEdition',3,'Clean Windows Server OS Edition','','AND',0,'/(Microsoft)(?>\\(R\\)|®)? (?:(Hyper-V|Windows)(?:\\(R\\))?) ((?:Server|))(?:\\(R\\)|®)? (\\d{4}(?: R2)?)(?:[,\\s]++)?([^\\s]*)(?: Edition(?: x64)?)?$/\n\n        Example :\n        Microsoft Windows Server 2012 R2 Datacenter -> #4 : Datacenter\n        Microsoft(R) Windows(R) Server 2003, Standard Edition x64 -> #4 : Standard\n        Microsoft Hyper-V Server 2012 R2 -> #4 :\n        Microsoft® Windows Server® 2008 Standard -> #4: Standard','2026-10-13 17:00:52',1,'clean_windows_server_os_edition',0,'2026-10-13 17:00:52');
/*!40000 ALTER TABLE `glpi_rules` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_savedsearches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_savedsearches` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `type` int(11) NOT NULL DEFAULT 0,
  `itemtype` varchar(100) NOT NULL,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_private` tinyint(4) NOT NULL DEFAULT 1,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `query` text DEFAULT NULL,
  `last_execution_time` int(11) DEFAULT NULL,
  `do_count` tinyint(4) NOT NULL DEFAULT 2,
  `last_execution_date` timestamp NULL DEFAULT NULL,
  `counter` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `type` (`type`),
  KEY `itemtype` (`itemtype`),
  KEY `entities_id` (`entities_id`),
  KEY `users_id` (`users_id`),
  KEY `is_private` (`is_private`),
  KEY `is_recursive` (`is_recursive`),
  KEY `last_execution_time` (`last_execution_time`),
  KEY `last_execution_date` (`last_execution_date`),
  KEY `do_count` (`do_count`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_savedsearches` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_savedsearches` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_savedsearches_alerts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_savedsearches_alerts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `savedsearches_id` int(10) unsigned NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT 0,
  `operator` tinyint(4) NOT NULL,
  `value` int(11) NOT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `frequency` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`savedsearches_id`,`operator`,`value`),
  KEY `name` (`name`),
  KEY `is_active` (`is_active`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_savedsearches_alerts` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_savedsearches_alerts` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_savedsearches_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_savedsearches_users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(100) NOT NULL,
  `savedsearches_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`users_id`,`itemtype`),
  KEY `savedsearches_id` (`savedsearches_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_savedsearches_users` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_savedsearches_users` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_searches_criteriafilters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_searches_criteriafilters` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `itemtype` varchar(100) DEFAULT NULL,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `search_itemtype` varchar(255) DEFAULT NULL,
  `search_criteria` longtext DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `item` (`itemtype`,`items_id`),
  KEY `search_itemtype` (`search_itemtype`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_searches_criteriafilters` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_searches_criteriafilters` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_slalevelactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_slalevelactions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `slalevels_id` int(10) unsigned NOT NULL DEFAULT 0,
  `action_type` varchar(255) DEFAULT NULL,
  `field` varchar(255) DEFAULT NULL,
  `value` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `slalevels_id` (`slalevels_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_slalevelactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_slalevelactions` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_slalevelcriterias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_slalevelcriterias` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `slalevels_id` int(10) unsigned NOT NULL DEFAULT 0,
  `criteria` varchar(255) DEFAULT NULL,
  `condition` int(11) NOT NULL DEFAULT 0,
  `pattern` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `slalevels_id` (`slalevels_id`),
  KEY `condition` (`condition`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_slalevelcriterias` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_slalevelcriterias` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_slalevels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_slalevels` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `slas_id` int(10) unsigned NOT NULL DEFAULT 0,
  `execution_time` int(11) NOT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT 1,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `match` char(10) DEFAULT NULL,
  `uuid` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `is_active` (`is_active`),
  KEY `slas_id` (`slas_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_slalevels` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_slalevels` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_slalevels_tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_slalevels_tickets` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tickets_id` int(10) unsigned NOT NULL DEFAULT 0,
  `slalevels_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`tickets_id`,`slalevels_id`),
  KEY `slalevels_id` (`slalevels_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_slalevels_tickets` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_slalevels_tickets` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_slas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_slas` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `type` int(11) NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `number_time` int(11) NOT NULL,
  `use_ticket_calendar` tinyint(4) NOT NULL DEFAULT 0,
  `calendars_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `definition_time` varchar(255) DEFAULT NULL,
  `end_of_working_day` tinyint(4) NOT NULL DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT NULL,
  `slms_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `calendars_id` (`calendars_id`),
  KEY `slms_id` (`slms_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_slas` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_slas` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_slms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_slms` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `use_ticket_calendar` tinyint(4) NOT NULL DEFAULT 0,
  `calendars_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `calendars_id` (`calendars_id`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_slms` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_slms` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_snmpcredentials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_snmpcredentials` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(64) DEFAULT NULL,
  `snmpversion` varchar(8) NOT NULL DEFAULT '1',
  `community` varchar(255) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `authentication` varchar(255) DEFAULT NULL,
  `auth_passphrase` varchar(255) DEFAULT NULL,
  `encryption` varchar(255) DEFAULT NULL,
  `priv_passphrase` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `snmpversion` (`snmpversion`),
  KEY `is_deleted` (`is_deleted`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_snmpcredentials` DISABLE KEYS */;
INSERT INTO `glpi_snmpcredentials` VALUES
(1,'Public community v1','1','public',NULL,NULL,NULL,NULL,NULL,0),
(2,'Public community v2c','2','public',NULL,NULL,NULL,NULL,NULL,0);
/*!40000 ALTER TABLE `glpi_snmpcredentials` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_socketmodels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_socketmodels` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_socketmodels` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_socketmodels` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_sockets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_sockets` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `position` int(11) NOT NULL DEFAULT 0,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `socketmodels_id` int(10) unsigned NOT NULL DEFAULT 0,
  `wiring_side` tinyint(4) DEFAULT 1,
  `itemtype` varchar(255) DEFAULT NULL,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `networkports_id` int(10) unsigned NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `socketmodels_id` (`socketmodels_id`),
  KEY `location_name` (`locations_id`,`name`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `networkports_id` (`networkports_id`),
  KEY `wiring_side` (`wiring_side`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_sockets` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_sockets` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_softwarecategories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_softwarecategories` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `softwarecategories_id` int(10) unsigned NOT NULL DEFAULT 0,
  `completename` text DEFAULT NULL,
  `level` int(11) NOT NULL DEFAULT 0,
  `ancestors_cache` longtext DEFAULT NULL,
  `sons_cache` longtext DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `softwarecategories_id` (`softwarecategories_id`),
  KEY `level` (`level`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_softwarecategories` DISABLE KEYS */;
INSERT INTO `glpi_softwarecategories` VALUES
(1,'Inventoried',NULL,0,'Software from inventories',1,NULL,NULL);
/*!40000 ALTER TABLE `glpi_softwarecategories` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_softwarelicenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_softwarelicenses` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `softwares_id` int(10) unsigned DEFAULT NULL,
  `softwarelicenses_id` int(10) unsigned NOT NULL DEFAULT 0,
  `completename` text DEFAULT NULL,
  `level` int(11) NOT NULL DEFAULT 0,
  `ancestors_cache` longtext DEFAULT NULL,
  `sons_cache` longtext DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `number` int(11) NOT NULL DEFAULT 0,
  `softwarelicensetypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `serial` varchar(255) DEFAULT NULL,
  `otherserial` varchar(255) DEFAULT NULL,
  `softwareversions_id_buy` int(10) unsigned NOT NULL DEFAULT 0,
  `softwareversions_id_use` int(10) unsigned NOT NULL DEFAULT 0,
  `expire` date DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `is_valid` tinyint(4) NOT NULL DEFAULT 1,
  `date_creation` timestamp NULL DEFAULT NULL,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id_tech` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_helpdesk_visible` tinyint(4) NOT NULL DEFAULT 0,
  `is_template` tinyint(4) NOT NULL DEFAULT 0,
  `template_name` varchar(255) DEFAULT NULL,
  `states_id` int(10) unsigned NOT NULL DEFAULT 0,
  `manufacturers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `contact` varchar(255) DEFAULT NULL,
  `contact_num` varchar(255) DEFAULT NULL,
  `allow_overquota` tinyint(4) NOT NULL DEFAULT 0,
  `pictures` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `is_template` (`is_template`),
  KEY `serial` (`serial`),
  KEY `otherserial` (`otherserial`),
  KEY `expire` (`expire`),
  KEY `softwareversions_id_buy` (`softwareversions_id_buy`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `softwarelicensetypes_id` (`softwarelicensetypes_id`),
  KEY `softwareversions_id_use` (`softwareversions_id_use`),
  KEY `date_mod` (`date_mod`),
  KEY `softwares_id_expire_number` (`softwares_id`,`expire`,`number`),
  KEY `locations_id` (`locations_id`),
  KEY `users_id_tech` (`users_id_tech`),
  KEY `users_id` (`users_id`),
  KEY `is_helpdesk_visible` (`is_helpdesk_visible`),
  KEY `active_assets` (`is_deleted`,`is_template`),
  KEY `date_creation` (`date_creation`),
  KEY `manufacturers_id` (`manufacturers_id`),
  KEY `states_id` (`states_id`),
  KEY `allow_overquota` (`allow_overquota`),
  KEY `softwarelicenses_id` (`softwarelicenses_id`),
  KEY `level` (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_softwarelicenses` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_softwarelicenses` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_softwarelicenses_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_softwarelicenses_users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `softwarelicenses_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `softwarelicenses_id` (`softwarelicenses_id`),
  KEY `users_id` (`users_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_softwarelicenses_users` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_softwarelicenses_users` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_softwarelicensetypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_softwarelicensetypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `softwarelicensetypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `level` int(11) NOT NULL DEFAULT 0,
  `ancestors_cache` longtext DEFAULT NULL,
  `sons_cache` longtext DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `completename` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `softwarelicensetypes_id` (`softwarelicensetypes_id`),
  KEY `level` (`level`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_softwarelicensetypes` DISABLE KEYS */;
INSERT INTO `glpi_softwarelicensetypes` VALUES
(1,'OEM',NULL,NULL,NULL,0,0,NULL,NULL,0,1,'OEM');
/*!40000 ALTER TABLE `glpi_softwarelicensetypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_softwares`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_softwares` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id_tech` int(10) unsigned NOT NULL DEFAULT 0,
  `is_update` tinyint(4) NOT NULL DEFAULT 0,
  `softwares_id` int(10) unsigned NOT NULL DEFAULT 0,
  `manufacturers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `is_template` tinyint(4) NOT NULL DEFAULT 0,
  `template_name` varchar(255) DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `ticket_tco` decimal(20,4) DEFAULT 0.0000,
  `is_helpdesk_visible` tinyint(4) NOT NULL DEFAULT 1,
  `softwarecategories_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_valid` tinyint(4) NOT NULL DEFAULT 1,
  `date_creation` timestamp NULL DEFAULT NULL,
  `pictures` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `date_mod` (`date_mod`),
  KEY `name` (`name`),
  KEY `is_template` (`is_template`),
  KEY `is_update` (`is_update`),
  KEY `softwarecategories_id` (`softwarecategories_id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `manufacturers_id` (`manufacturers_id`),
  KEY `users_id` (`users_id`),
  KEY `locations_id` (`locations_id`),
  KEY `users_id_tech` (`users_id_tech`),
  KEY `softwares_id` (`softwares_id`),
  KEY `is_helpdesk_visible` (`is_helpdesk_visible`),
  KEY `date_creation` (`date_creation`),
  KEY `active_assets` (`is_deleted`,`is_template`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_softwares` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_softwares` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_softwareversions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_softwareversions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `softwares_id` int(10) unsigned NOT NULL DEFAULT 0,
  `states_id` int(10) unsigned NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `arch` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `operatingsystems_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `arch` (`arch`),
  KEY `softwares_id` (`softwares_id`),
  KEY `states_id` (`states_id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `operatingsystems_id` (`operatingsystems_id`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_softwareversions` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_softwareversions` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_solutiontemplates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_solutiontemplates` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `content` mediumtext DEFAULT NULL,
  `solutiontypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `is_recursive` (`is_recursive`),
  KEY `solutiontypes_id` (`solutiontypes_id`),
  KEY `entities_id` (`entities_id`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_solutiontemplates` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_solutiontemplates` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_solutiontypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_solutiontypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 1,
  `is_incident` tinyint(4) NOT NULL DEFAULT 1,
  `is_request` tinyint(4) NOT NULL DEFAULT 1,
  `is_problem` tinyint(4) NOT NULL DEFAULT 1,
  `is_change` tinyint(4) NOT NULL DEFAULT 1,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `is_incident` (`is_incident`),
  KEY `is_request` (`is_request`),
  KEY `is_problem` (`is_problem`),
  KEY `is_change` (`is_change`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_solutiontypes` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_solutiontypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_ssovariables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_ssovariables` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_ssovariables` DISABLE KEYS */;
INSERT INTO `glpi_ssovariables` VALUES
(1,'HTTP_AUTH_USER',NULL,NULL,NULL),
(2,'REMOTE_USER',NULL,NULL,NULL),
(3,'PHP_AUTH_USER',NULL,NULL,NULL),
(4,'USERNAME',NULL,NULL,NULL),
(5,'REDIRECT_REMOTE_USER',NULL,NULL,NULL),
(6,'HTTP_REMOTE_USER',NULL,NULL,NULL);
/*!40000 ALTER TABLE `glpi_ssovariables` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_states`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_states` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `states_id` int(10) unsigned NOT NULL DEFAULT 0,
  `completename` text DEFAULT NULL,
  `level` int(11) NOT NULL DEFAULT 0,
  `ancestors_cache` longtext DEFAULT NULL,
  `sons_cache` longtext DEFAULT NULL,
  `is_helpdesk_visible` tinyint(4) NOT NULL DEFAULT 1,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`states_id`,`name`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `is_helpdesk_visible` (`is_helpdesk_visible`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `level` (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_states` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_states` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_stencils`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_stencils` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `itemtype` varchar(100) NOT NULL,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `nb_zones` int(11) NOT NULL DEFAULT 1,
  `zones` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`zones`)),
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`itemtype`,`items_id`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_stencils` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_stencils` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_suppliers` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `suppliertypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `registration_number` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `postcode` varchar(255) DEFAULT NULL,
  `town` varchar(255) DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `phonenumber` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `fax` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT 0,
  `pictures` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `suppliertypes_id` (`suppliertypes_id`),
  KEY `is_deleted` (`is_deleted`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_suppliers` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_suppliers` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_suppliers_tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_suppliers_tickets` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tickets_id` int(10) unsigned NOT NULL DEFAULT 0,
  `suppliers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `type` int(11) NOT NULL DEFAULT 1,
  `use_notification` tinyint(4) NOT NULL DEFAULT 1,
  `alternative_email` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`tickets_id`,`type`,`suppliers_id`),
  KEY `group` (`suppliers_id`,`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_suppliers_tickets` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_suppliers_tickets` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_suppliertypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_suppliertypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_suppliertypes` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_suppliertypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_taskcategories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_taskcategories` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `taskcategories_id` int(10) unsigned NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `completename` text DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `level` int(11) NOT NULL DEFAULT 0,
  `ancestors_cache` longtext DEFAULT NULL,
  `sons_cache` longtext DEFAULT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT 1,
  `is_helpdeskvisible` tinyint(4) NOT NULL DEFAULT 1,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `knowbaseitemcategories_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `taskcategories_id` (`taskcategories_id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `is_active` (`is_active`),
  KEY `is_helpdeskvisible` (`is_helpdeskvisible`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `knowbaseitemcategories_id` (`knowbaseitemcategories_id`),
  KEY `level` (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_taskcategories` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_taskcategories` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_tasktemplates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_tasktemplates` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `content` mediumtext DEFAULT NULL,
  `taskcategories_id` int(10) unsigned NOT NULL DEFAULT 0,
  `actiontime` int(11) NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `pendingreasons_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `state` int(11) NOT NULL DEFAULT 0,
  `is_private` tinyint(4) NOT NULL DEFAULT 0,
  `users_id_tech` int(10) unsigned NOT NULL DEFAULT 0,
  `use_current_user` tinyint(4) NOT NULL DEFAULT 0,
  `groups_id_tech` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `is_recursive` (`is_recursive`),
  KEY `taskcategories_id` (`taskcategories_id`),
  KEY `entities_id` (`entities_id`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `is_private` (`is_private`),
  KEY `users_id_tech` (`users_id_tech`),
  KEY `groups_id_tech` (`groups_id_tech`),
  KEY `pendingreasons_id` (`pendingreasons_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_tasktemplates` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_tasktemplates` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_ticketcosts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_ticketcosts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tickets_id` int(10) unsigned NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `begin_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `actiontime` int(11) NOT NULL DEFAULT 0,
  `cost_time` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `cost_fixed` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `cost_material` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `budgets_id` int(10) unsigned NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `tickets_id` (`tickets_id`),
  KEY `begin_date` (`begin_date`),
  KEY `end_date` (`end_date`),
  KEY `entities_id` (`entities_id`),
  KEY `budgets_id` (`budgets_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_ticketcosts` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_ticketcosts` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_ticketrecurrents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_ticketrecurrents` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_active` tinyint(4) NOT NULL DEFAULT 0,
  `tickettemplates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `begin_date` timestamp NULL DEFAULT NULL,
  `periodicity` varchar(255) DEFAULT NULL,
  `create_before` int(11) NOT NULL DEFAULT 0,
  `next_creation_date` timestamp NULL DEFAULT NULL,
  `calendars_id` int(10) unsigned NOT NULL DEFAULT 0,
  `end_date` timestamp NULL DEFAULT NULL,
  `ticket_per_item` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_active` (`is_active`),
  KEY `tickettemplates_id` (`tickettemplates_id`),
  KEY `next_creation_date` (`next_creation_date`),
  KEY `calendars_id` (`calendars_id`),
  KEY `ticket_per_item` (`ticket_per_item`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_ticketrecurrents` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_ticketrecurrents` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_tickets` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `date` timestamp NULL DEFAULT NULL,
  `closedate` timestamp NULL DEFAULT NULL,
  `solvedate` timestamp NULL DEFAULT NULL,
  `takeintoaccountdate` timestamp NULL DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `users_id_lastupdater` int(10) unsigned NOT NULL DEFAULT 0,
  `status` int(11) NOT NULL DEFAULT 1,
  `users_id_recipient` int(10) unsigned NOT NULL DEFAULT 0,
  `requesttypes_id` int(10) unsigned NOT NULL DEFAULT 0,
  `content` longtext DEFAULT NULL,
  `urgency` int(11) NOT NULL DEFAULT 1,
  `impact` int(11) NOT NULL DEFAULT 1,
  `priority` int(11) NOT NULL DEFAULT 1,
  `itilcategories_id` int(10) unsigned NOT NULL DEFAULT 0,
  `type` int(11) NOT NULL DEFAULT 1,
  `global_validation` int(11) NOT NULL DEFAULT 1,
  `slas_id_ttr` int(10) unsigned NOT NULL DEFAULT 0,
  `slas_id_tto` int(10) unsigned NOT NULL DEFAULT 0,
  `slalevels_id_ttr` int(10) unsigned NOT NULL DEFAULT 0,
  `time_to_resolve` timestamp NULL DEFAULT NULL,
  `time_to_own` timestamp NULL DEFAULT NULL,
  `begin_waiting_date` timestamp NULL DEFAULT NULL,
  `sla_waiting_duration` int(11) NOT NULL DEFAULT 0,
  `ola_waiting_duration` int(11) NOT NULL DEFAULT 0,
  `olas_id_tto` int(10) unsigned NOT NULL DEFAULT 0,
  `olas_id_ttr` int(10) unsigned NOT NULL DEFAULT 0,
  `olalevels_id_ttr` int(10) unsigned NOT NULL DEFAULT 0,
  `ola_tto_begin_date` timestamp NULL DEFAULT NULL,
  `ola_ttr_begin_date` timestamp NULL DEFAULT NULL,
  `internal_time_to_resolve` timestamp NULL DEFAULT NULL,
  `internal_time_to_own` timestamp NULL DEFAULT NULL,
  `waiting_duration` int(11) NOT NULL DEFAULT 0,
  `close_delay_stat` int(11) NOT NULL DEFAULT 0,
  `solve_delay_stat` int(11) NOT NULL DEFAULT 0,
  `takeintoaccount_delay_stat` int(11) NOT NULL DEFAULT 0,
  `actiontime` int(11) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT NULL,
  `tickettemplates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `externalid` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `date` (`date`),
  KEY `closedate` (`closedate`),
  KEY `status` (`status`),
  KEY `priority` (`priority`),
  KEY `request_type` (`requesttypes_id`),
  KEY `date_mod` (`date_mod`),
  KEY `entities_id` (`entities_id`),
  KEY `users_id_recipient` (`users_id_recipient`),
  KEY `solvedate` (`solvedate`),
  KEY `takeintoaccountdate` (`takeintoaccountdate`),
  KEY `urgency` (`urgency`),
  KEY `impact` (`impact`),
  KEY `global_validation` (`global_validation`),
  KEY `slas_id_tto` (`slas_id_tto`),
  KEY `slas_id_ttr` (`slas_id_ttr`),
  KEY `time_to_resolve` (`time_to_resolve`),
  KEY `time_to_own` (`time_to_own`),
  KEY `olas_id_tto` (`olas_id_tto`),
  KEY `olas_id_ttr` (`olas_id_ttr`),
  KEY `slalevels_id_ttr` (`slalevels_id_ttr`),
  KEY `internal_time_to_resolve` (`internal_time_to_resolve`),
  KEY `internal_time_to_own` (`internal_time_to_own`),
  KEY `users_id_lastupdater` (`users_id_lastupdater`),
  KEY `type` (`type`),
  KEY `itilcategories_id` (`itilcategories_id`),
  KEY `is_deleted` (`is_deleted`),
  KEY `name` (`name`),
  KEY `locations_id` (`locations_id`),
  KEY `date_creation` (`date_creation`),
  KEY `ola_waiting_duration` (`ola_waiting_duration`),
  KEY `olalevels_id_ttr` (`olalevels_id_ttr`),
  KEY `tickettemplates_id` (`tickettemplates_id`)
) ENGINE=InnoDB AUTO_INCREMENT=78 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_tickets` DISABLE KEYS */;
INSERT INTO `glpi_tickets` VALUES
(11,0,'PASO3-C llamante externo (usuario generico)','2026-10-13 19:21:27',NULL,NULL,'2026-10-13 21:06:05','2026-10-14 14:05:06',2,1,0,3,'Llamante: Juan Perez | Telefono: +34 600 111 222 | Empresa: ACME. Consulta de facturacion.',3,3,3,0,1,1,0,0,0,NULL,NULL,'2026-10-14 14:05:06',0,0,0,0,0,NULL,NULL,NULL,NULL,0,0,67419,6278,0,0,0,'2026-10-13 19:21:27',0,NULL),
(57,0,'TEST sin asignar','2026-10-14 13:05:32',NULL,NULL,'2026-10-14 13:05:33','2026-10-14 13:05:33',2,1,2,1,'',3,3,3,0,1,1,0,0,0,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,NULL,NULL,0,0,0,1,0,0,0,'2026-10-14 13:05:32',0,NULL),
(58,0,'Paso E ticket interno Playwright','2026-10-14 13:05:32',NULL,NULL,'2026-10-14 13:05:32','2026-10-14 13:05:32',2,2,2,1,'Solicitud de acceso interno',3,3,3,0,1,1,0,0,0,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,NULL,NULL,0,0,0,1,0,0,0,'2026-10-14 13:05:32',0,NULL),
(59,0,'Paso E ticket externo Playwright','2026-10-14 13:05:33',NULL,NULL,'2026-10-14 13:05:33','2026-10-14 13:05:33',2,2,2,1,'Llamante: Juan Perez · Tel: +34 600 111 222 · Empresa: ACME\n\nLaptop no enciende',3,3,3,0,1,1,0,0,0,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,NULL,NULL,0,0,0,1,0,0,0,'2026-10-14 13:05:33',0,NULL),
(60,0,'Paso E ticket externo Playwright','2026-10-14 13:33:15',NULL,NULL,'2026-10-14 13:33:15','2026-10-14 13:33:15',2,2,2,1,'Llamante: Juan Perez · Tel: +34 600 111 222 · Empresa: ACME\n\nLaptop no enciende',3,3,3,0,1,1,0,0,0,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,NULL,NULL,0,0,0,1,0,0,0,'2026-10-14 13:33:15',0,NULL),
(61,0,'TEST sin asignar','2026-10-14 13:33:15',NULL,NULL,'2026-10-14 13:33:15','2026-10-14 13:33:15',2,1,2,1,'',3,3,3,0,1,1,0,0,0,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,NULL,NULL,0,0,0,1,0,0,0,'2026-10-14 13:33:15',0,NULL),
(62,0,'Paso E ticket interno Playwright','2026-10-14 13:33:15',NULL,NULL,'2026-10-14 13:33:15','2026-10-14 13:33:15',2,2,2,1,'Solicitud de acceso interno',3,3,3,0,1,1,0,0,0,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,NULL,NULL,0,0,0,1,0,0,0,'2026-10-14 13:33:15',0,NULL),
(63,0,'Paso E ticket externo Playwright','2026-10-14 13:36:01',NULL,NULL,'2026-10-14 13:36:01','2026-10-14 13:36:01',2,2,2,1,'Llamante: Juan Perez · Tel: +34 600 111 222 · Empresa: ACME\n\nLaptop no enciende',3,3,3,0,1,1,0,0,0,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,NULL,NULL,0,0,0,1,0,0,0,'2026-10-14 13:36:01',0,NULL),
(64,0,'Paso E ticket interno Playwright','2026-10-14 13:36:01',NULL,NULL,'2026-10-14 13:36:01','2026-10-14 13:36:01',2,2,2,1,'Solicitud de acceso interno',3,3,3,0,1,1,0,0,0,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,NULL,NULL,0,0,0,1,0,0,0,'2026-10-14 13:36:01',0,NULL),
(65,0,'TEST sin asignar','2026-10-14 13:36:01',NULL,NULL,'2026-10-14 13:36:01','2026-10-14 13:36:02',2,1,2,1,'',3,3,3,0,1,1,0,0,0,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,NULL,NULL,0,0,0,1,0,0,0,'2026-10-14 13:36:01',0,NULL),
(66,0,'Paso E ticket interno Playwright','2026-10-14 13:53:04',NULL,NULL,'2026-10-14 13:53:04','2026-10-14 13:53:04',2,2,2,1,'Solicitud de acceso interno',3,3,3,0,1,1,0,0,0,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,NULL,NULL,0,0,0,1,0,0,0,'2026-10-14 13:53:04',0,NULL),
(67,0,'TEST sin asignar','2026-10-14 13:53:04',NULL,NULL,'2026-10-14 13:53:05','2026-10-14 13:53:05',2,1,2,1,'',3,3,3,0,1,1,0,0,0,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,NULL,NULL,0,0,0,1,0,0,0,'2026-10-14 13:53:04',0,NULL),
(68,0,'Paso E ticket externo Playwright','2026-10-14 13:53:05',NULL,NULL,'2026-10-14 13:53:05','2026-10-14 13:53:05',2,2,2,1,'Llamante: Juan Perez · Tel: +34 600 111 222 · Empresa: ACME\n\nLaptop no enciende',3,3,3,0,1,1,0,0,0,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,NULL,NULL,0,0,0,1,0,0,0,'2026-10-14 13:53:05',0,NULL),
(69,0,'Paso E ticket interno Playwright','2026-10-14 13:53:44',NULL,NULL,'2026-10-14 13:53:44','2026-10-14 13:53:44',2,2,2,1,'Solicitud de acceso interno',3,3,3,0,1,1,0,0,0,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,NULL,NULL,0,0,0,1,0,0,0,'2026-10-14 13:53:44',0,NULL),
(70,0,'Paso E ticket externo Playwright','2026-10-14 13:53:45',NULL,NULL,'2026-10-14 13:53:45','2026-10-14 13:53:45',2,2,2,1,'Llamante: Juan Perez · Tel: +34 600 111 222 · Empresa: ACME\n\nLaptop no enciende',3,3,3,0,1,1,0,0,0,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,NULL,NULL,0,0,0,1,0,0,0,'2026-10-14 13:53:45',0,NULL),
(71,0,'TEST sin asignar','2026-10-14 13:53:45',NULL,NULL,'2026-10-14 13:53:45','2026-10-14 13:53:45',2,1,2,1,'',3,3,3,0,1,1,0,0,0,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,NULL,NULL,0,0,0,1,0,0,0,'2026-10-14 13:53:45',0,NULL),
(72,0,'Paso E ticket externo Playwright','2026-10-14 14:04:24',NULL,NULL,'2026-10-14 14:04:24','2026-10-14 14:04:24',2,2,2,1,'Llamante: Juan Perez · Tel: +34 600 111 222 · Empresa: ACME\n\nLaptop no enciende',3,3,3,0,1,1,0,0,0,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,NULL,NULL,0,0,0,1,0,0,0,'2026-10-14 14:04:24',0,NULL),
(73,0,'Paso E ticket interno Playwright','2026-10-14 14:04:24',NULL,NULL,'2026-10-14 14:04:24','2026-10-14 14:04:24',2,2,2,1,'Solicitud de acceso interno',3,3,3,0,1,1,0,0,0,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,NULL,NULL,0,0,0,1,0,0,0,'2026-10-14 14:04:24',0,NULL),
(74,0,'TEST sin asignar','2026-10-14 14:04:24',NULL,NULL,'2026-10-14 14:04:24','2026-10-14 14:04:24',2,1,2,1,'',3,3,3,0,1,1,0,0,0,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,NULL,NULL,0,0,0,1,0,0,0,'2026-10-14 14:04:24',0,NULL),
(75,0,'Paso E ticket interno Playwright','2026-10-14 14:04:58',NULL,NULL,'2026-10-14 14:04:58','2026-10-14 14:04:58',2,2,2,1,'Solicitud de acceso interno',3,3,3,0,1,1,0,0,0,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,NULL,NULL,0,0,0,1,0,0,0,'2026-10-14 14:04:58',0,NULL),
(76,0,'Paso E ticket externo Playwright','2026-10-14 14:04:58',NULL,NULL,'2026-10-14 14:04:58','2026-10-14 14:04:58',2,2,2,1,'Llamante: Juan Perez · Tel: +34 600 111 222 · Empresa: ACME\n\nLaptop no enciende',3,3,3,0,1,1,0,0,0,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,NULL,NULL,0,0,0,1,0,0,0,'2026-10-14 14:04:58',0,NULL),
(77,0,'TEST sin asignar','2026-10-14 14:04:58',NULL,NULL,'2026-10-14 14:04:58','2026-10-14 14:04:59',2,1,2,1,'',3,3,3,0,1,1,0,0,0,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,NULL,NULL,0,0,0,1,0,0,0,'2026-10-14 14:04:58',0,NULL);
/*!40000 ALTER TABLE `glpi_tickets` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_tickets_contracts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_tickets_contracts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tickets_id` int(10) unsigned NOT NULL DEFAULT 0,
  `contracts_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`tickets_id`,`contracts_id`),
  KEY `contracts_id` (`contracts_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_tickets_contracts` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_tickets_contracts` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_tickets_tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_tickets_tickets` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tickets_id_1` int(10) unsigned NOT NULL DEFAULT 0,
  `tickets_id_2` int(10) unsigned NOT NULL DEFAULT 0,
  `link` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`tickets_id_1`,`tickets_id_2`),
  KEY `tickets_id_2` (`tickets_id_2`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_tickets_tickets` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_tickets_tickets` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_tickets_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_tickets_users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tickets_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `type` int(11) NOT NULL DEFAULT 1,
  `use_notification` tinyint(4) NOT NULL DEFAULT 1,
  `alternative_email` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`tickets_id`,`type`,`users_id`,`alternative_email`),
  KEY `user` (`users_id`,`type`)
) ENGINE=InnoDB AUTO_INCREMENT=155 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_tickets_users` DISABLE KEYS */;
INSERT INTO `glpi_tickets_users` VALUES
(114,57,7,1,1,''),
(115,58,7,1,1,''),
(116,58,7,2,1,''),
(117,59,7,2,1,''),
(118,59,0,1,1,'juan@acme.com'),
(120,60,7,2,1,''),
(121,62,7,1,1,''),
(122,61,7,1,1,''),
(123,62,7,2,1,''),
(124,60,0,1,1,'juan@acme.com'),
(125,63,7,2,1,''),
(126,63,0,1,1,'juan@acme.com'),
(127,64,7,1,1,''),
(128,64,7,2,1,''),
(129,65,7,1,1,''),
(131,66,7,1,1,''),
(132,66,7,2,1,''),
(133,67,7,1,1,''),
(134,68,7,2,1,''),
(135,68,0,1,1,'juan@acme.com'),
(137,69,7,1,1,''),
(138,69,7,2,1,''),
(139,70,7,2,1,''),
(140,70,0,1,1,'juan@acme.com'),
(141,71,7,1,1,''),
(143,72,7,2,1,''),
(144,73,7,1,1,''),
(145,73,7,2,1,''),
(146,74,7,1,1,''),
(147,72,0,1,1,'juan@acme.com'),
(149,75,7,1,1,''),
(150,75,7,2,1,''),
(151,76,7,2,1,''),
(152,77,7,1,1,''),
(153,76,0,1,1,'juan@acme.com');
/*!40000 ALTER TABLE `glpi_tickets_users` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_ticketsatisfactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_ticketsatisfactions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tickets_id` int(10) unsigned NOT NULL DEFAULT 0,
  `type` int(11) NOT NULL DEFAULT 1,
  `date_begin` timestamp NULL DEFAULT NULL,
  `date_answered` timestamp NULL DEFAULT NULL,
  `satisfaction` int(11) DEFAULT NULL,
  `satisfaction_scaled_to_5` float DEFAULT NULL,
  `comment` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tickets_id` (`tickets_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_ticketsatisfactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_ticketsatisfactions` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_tickettasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_tickettasks` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) DEFAULT NULL,
  `tickets_id` int(10) unsigned NOT NULL DEFAULT 0,
  `taskcategories_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date` timestamp NULL DEFAULT NULL,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id_editor` int(10) unsigned NOT NULL DEFAULT 0,
  `content` longtext DEFAULT NULL,
  `is_private` tinyint(4) NOT NULL DEFAULT 0,
  `actiontime` int(11) NOT NULL DEFAULT 0,
  `begin` timestamp NULL DEFAULT NULL,
  `end` timestamp NULL DEFAULT NULL,
  `state` int(11) NOT NULL DEFAULT 1,
  `users_id_tech` int(10) unsigned NOT NULL DEFAULT 0,
  `groups_id_tech` int(10) unsigned NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `tasktemplates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `timeline_position` tinyint(4) NOT NULL DEFAULT 0,
  `sourceitems_id` int(10) unsigned NOT NULL DEFAULT 0,
  `sourceof_items_id` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `date` (`date`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `users_id` (`users_id`),
  KEY `users_id_editor` (`users_id_editor`),
  KEY `tickets_id` (`tickets_id`),
  KEY `is_private` (`is_private`),
  KEY `taskcategories_id` (`taskcategories_id`),
  KEY `state` (`state`),
  KEY `users_id_tech` (`users_id_tech`),
  KEY `groups_id_tech` (`groups_id_tech`),
  KEY `begin` (`begin`),
  KEY `end` (`end`),
  KEY `tasktemplates_id` (`tasktemplates_id`),
  KEY `sourceitems_id` (`sourceitems_id`),
  KEY `sourceof_items_id` (`sourceof_items_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_tickettasks` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_tickettasks` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_tickettemplatehiddenfields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_tickettemplatehiddenfields` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tickettemplates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `num` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`tickettemplates_id`,`num`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_tickettemplatehiddenfields` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_tickettemplatehiddenfields` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_tickettemplatemandatoryfields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_tickettemplatemandatoryfields` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tickettemplates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `num` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`tickettemplates_id`,`num`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_tickettemplatemandatoryfields` DISABLE KEYS */;
INSERT INTO `glpi_tickettemplatemandatoryfields` VALUES
(1,1,21);
/*!40000 ALTER TABLE `glpi_tickettemplatemandatoryfields` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_tickettemplatepredefinedfields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_tickettemplatepredefinedfields` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tickettemplates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `num` int(11) NOT NULL DEFAULT 0,
  `value` longtext DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tickettemplates_id` (`tickettemplates_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_tickettemplatepredefinedfields` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_tickettemplatepredefinedfields` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_tickettemplatereadonlyfields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_tickettemplatereadonlyfields` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tickettemplates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `num` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`tickettemplates_id`,`num`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_tickettemplatereadonlyfields` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_tickettemplatereadonlyfields` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_tickettemplates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_tickettemplates` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `allowed_statuses` varchar(255) NOT NULL DEFAULT '[1,10,2,3,4,5,6]',
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_tickettemplates` DISABLE KEYS */;
INSERT INTO `glpi_tickettemplates` VALUES
(1,'Default',0,1,NULL,'[1,10,2,3,4,5,6]');
/*!40000 ALTER TABLE `glpi_tickettemplates` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_ticketvalidations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_ticketvalidations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `itils_validationsteps_id` int(10) unsigned NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `tickets_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id_validate` int(10) unsigned NOT NULL DEFAULT 0,
  `itilvalidationtemplates_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype_target` varchar(255) NOT NULL,
  `items_id_target` int(10) unsigned NOT NULL DEFAULT 0,
  `comment_submission` text DEFAULT NULL,
  `comment_validation` text DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 2,
  `submission_date` timestamp NULL DEFAULT NULL,
  `validation_date` timestamp NULL DEFAULT NULL,
  `timeline_position` tinyint(4) NOT NULL DEFAULT 0,
  `last_reminder_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `entities_id` (`entities_id`),
  KEY `users_id` (`users_id`),
  KEY `users_id_validate` (`users_id_validate`),
  KEY `itilvalidationtemplates_id` (`itilvalidationtemplates_id`),
  KEY `item_target` (`itemtype_target`,`items_id_target`),
  KEY `tickets_id` (`tickets_id`),
  KEY `submission_date` (`submission_date`),
  KEY `validation_date` (`validation_date`),
  KEY `status` (`status`),
  KEY `itils_validationsteps_id` (`itils_validationsteps_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_ticketvalidations` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_ticketvalidations` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_transfers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_transfers` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `keep_ticket` int(11) NOT NULL DEFAULT 0,
  `keep_networklink` int(11) NOT NULL DEFAULT 0,
  `keep_reservation` int(11) NOT NULL DEFAULT 0,
  `keep_history` int(11) NOT NULL DEFAULT 0,
  `keep_device` int(11) NOT NULL DEFAULT 0,
  `keep_infocom` int(11) NOT NULL DEFAULT 0,
  `keep_dc_monitor` int(11) NOT NULL DEFAULT 0,
  `clean_dc_monitor` int(11) NOT NULL DEFAULT 0,
  `keep_dc_phone` int(11) NOT NULL DEFAULT 0,
  `clean_dc_phone` int(11) NOT NULL DEFAULT 0,
  `keep_dc_peripheral` int(11) NOT NULL DEFAULT 0,
  `clean_dc_peripheral` int(11) NOT NULL DEFAULT 0,
  `keep_dc_printer` int(11) NOT NULL DEFAULT 0,
  `clean_dc_printer` int(11) NOT NULL DEFAULT 0,
  `keep_supplier` int(11) NOT NULL DEFAULT 0,
  `clean_supplier` int(11) NOT NULL DEFAULT 0,
  `keep_contact` int(11) NOT NULL DEFAULT 0,
  `clean_contact` int(11) NOT NULL DEFAULT 0,
  `keep_contract` int(11) NOT NULL DEFAULT 0,
  `clean_contract` int(11) NOT NULL DEFAULT 0,
  `keep_software` int(11) NOT NULL DEFAULT 0,
  `clean_software` int(11) NOT NULL DEFAULT 0,
  `keep_document` int(11) NOT NULL DEFAULT 0,
  `clean_document` int(11) NOT NULL DEFAULT 0,
  `keep_cartridgeitem` int(11) NOT NULL DEFAULT 0,
  `clean_cartridgeitem` int(11) NOT NULL DEFAULT 0,
  `keep_cartridge` int(11) NOT NULL DEFAULT 0,
  `keep_consumable` int(11) NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `keep_disk` int(11) NOT NULL DEFAULT 0,
  `keep_certificate` int(11) NOT NULL DEFAULT 0,
  `clean_certificate` int(11) NOT NULL DEFAULT 0,
  `lock_updated_fields` int(11) NOT NULL DEFAULT 0,
  `keep_location` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_transfers` DISABLE KEYS */;
INSERT INTO `glpi_transfers` VALUES
(1,'complete',2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,NULL,NULL,NULL,1,1,1,0,1);
/*!40000 ALTER TABLE `glpi_transfers` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_unmanageds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_unmanageds` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `serial` varchar(255) DEFAULT NULL,
  `otherserial` varchar(255) DEFAULT NULL,
  `contact` varchar(255) DEFAULT NULL,
  `contact_num` varchar(255) DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `networks_id` int(10) unsigned NOT NULL DEFAULT 0,
  `manufacturers_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `states_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id_tech` int(10) unsigned NOT NULL DEFAULT 0,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT NULL,
  `autoupdatesystems_id` int(10) unsigned NOT NULL DEFAULT 0,
  `sysdescr` text DEFAULT NULL,
  `agents_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(100) DEFAULT NULL,
  `accepted` tinyint(4) NOT NULL DEFAULT 0,
  `hub` tinyint(4) NOT NULL DEFAULT 0,
  `ip` varchar(255) DEFAULT NULL,
  `snmpcredentials_id` int(10) unsigned NOT NULL DEFAULT 0,
  `last_inventory_update` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `manufacturers_id` (`manufacturers_id`),
  KEY `users_id` (`users_id`),
  KEY `locations_id` (`locations_id`),
  KEY `networks_id` (`networks_id`),
  KEY `states_id` (`states_id`),
  KEY `is_deleted` (`is_deleted`),
  KEY `date_mod` (`date_mod`),
  KEY `is_dynamic` (`is_dynamic`),
  KEY `serial` (`serial`),
  KEY `otherserial` (`otherserial`),
  KEY `date_creation` (`date_creation`),
  KEY `autoupdatesystems_id` (`autoupdatesystems_id`),
  KEY `agents_id` (`agents_id`),
  KEY `snmpcredentials_id` (`snmpcredentials_id`),
  KEY `users_id_tech` (`users_id_tech`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_unmanageds` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_unmanageds` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_usbvendors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_usbvendors` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `vendorid` varchar(4) NOT NULL,
  `deviceid` varchar(4) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`vendorid`,`deviceid`),
  KEY `deviceid` (`deviceid`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_usbvendors` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_usbvendors` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_usercategories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_usercategories` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_usercategories` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_usercategories` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_useremails`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_useremails` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_default` tinyint(4) NOT NULL DEFAULT 0,
  `is_dynamic` tinyint(4) NOT NULL DEFAULT 0,
  `email` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`users_id`,`email`),
  KEY `email` (`email`),
  KEY `is_default` (`is_default`),
  KEY `is_dynamic` (`is_dynamic`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_useremails` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_useremails` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `password_last_update` timestamp NULL DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `phone2` varchar(255) DEFAULT NULL,
  `mobile` varchar(255) DEFAULT NULL,
  `realname` varchar(255) DEFAULT NULL,
  `firstname` varchar(255) DEFAULT NULL,
  `locations_id` int(10) unsigned NOT NULL DEFAULT 0,
  `language` char(10) DEFAULT NULL,
  `use_mode` int(11) NOT NULL DEFAULT 0,
  `list_limit` int(11) DEFAULT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT 1,
  `comment` text DEFAULT NULL,
  `auths_id` int(10) unsigned NOT NULL DEFAULT 0,
  `authtype` int(11) NOT NULL DEFAULT 0,
  `last_login` timestamp NULL DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_sync` timestamp NULL DEFAULT NULL,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `profiles_id` int(10) unsigned NOT NULL DEFAULT 0,
  `entities_id` int(10) unsigned DEFAULT 0,
  `usertitles_id` int(10) unsigned NOT NULL DEFAULT 0,
  `usercategories_id` int(10) unsigned NOT NULL DEFAULT 0,
  `date_format` int(11) DEFAULT NULL,
  `number_format` int(11) DEFAULT NULL,
  `names_format` int(11) DEFAULT NULL,
  `csv_delimiter` char(1) DEFAULT NULL,
  `is_ids_visible` tinyint(4) DEFAULT NULL,
  `use_flat_dropdowntree` tinyint(4) DEFAULT NULL,
  `use_flat_dropdowntree_on_search_result` tinyint(4) DEFAULT NULL,
  `show_jobs_at_login` tinyint(4) DEFAULT NULL,
  `priority_1` char(20) DEFAULT NULL,
  `priority_2` char(20) DEFAULT NULL,
  `priority_3` char(20) DEFAULT NULL,
  `priority_4` char(20) DEFAULT NULL,
  `priority_5` char(20) DEFAULT NULL,
  `priority_6` char(20) DEFAULT NULL,
  `followup_private` tinyint(4) DEFAULT NULL,
  `task_private` tinyint(4) DEFAULT NULL,
  `default_requesttypes_id` int(10) unsigned DEFAULT NULL,
  `password_forget_token` varchar(255) DEFAULT NULL,
  `password_forget_token_date` timestamp NULL DEFAULT NULL,
  `user_dn` text DEFAULT NULL,
  `user_dn_hash` varchar(32) DEFAULT NULL,
  `registration_number` varchar(255) DEFAULT NULL,
  `show_count_on_tabs` tinyint(4) DEFAULT NULL,
  `refresh_views` int(11) DEFAULT NULL,
  `set_default_tech` tinyint(4) DEFAULT NULL,
  `set_followup_tech` tinyint(4) DEFAULT NULL,
  `set_solution_tech` tinyint(4) DEFAULT NULL,
  `personal_token` varchar(255) DEFAULT NULL,
  `personal_token_date` timestamp NULL DEFAULT NULL,
  `api_token` varchar(255) DEFAULT NULL,
  `api_token_date` timestamp NULL DEFAULT NULL,
  `cookie_token` varchar(255) DEFAULT NULL,
  `cookie_token_date` timestamp NULL DEFAULT NULL,
  `display_count_on_home` int(11) DEFAULT NULL,
  `notification_to_myself` tinyint(4) DEFAULT NULL,
  `duedateok_color` varchar(255) DEFAULT NULL,
  `duedatewarning_color` varchar(255) DEFAULT NULL,
  `duedatecritical_color` varchar(255) DEFAULT NULL,
  `duedatewarning_less` int(11) DEFAULT NULL,
  `duedatecritical_less` int(11) DEFAULT NULL,
  `duedatewarning_unit` varchar(255) DEFAULT NULL,
  `duedatecritical_unit` varchar(255) DEFAULT NULL,
  `is_deleted_ldap` tinyint(4) NOT NULL DEFAULT 0,
  `pdffont` varchar(255) DEFAULT NULL,
  `picture` varchar(255) DEFAULT NULL,
  `begin_date` timestamp NULL DEFAULT NULL,
  `end_date` timestamp NULL DEFAULT NULL,
  `keep_devices_when_purging_item` tinyint(4) DEFAULT NULL,
  `privatebookmarkorder` longtext DEFAULT NULL,
  `backcreated` tinyint(4) DEFAULT NULL,
  `task_state` int(11) DEFAULT NULL,
  `planned_task_state` int(11) DEFAULT NULL,
  `palette` char(20) DEFAULT NULL,
  `page_layout` char(20) DEFAULT NULL,
  `fold_menu` tinyint(4) DEFAULT NULL,
  `savedsearches_pinned` text DEFAULT NULL,
  `timeline_order` char(20) DEFAULT NULL,
  `itil_layout` text DEFAULT NULL,
  `richtext_layout` char(20) DEFAULT NULL,
  `set_default_requester` tinyint(4) DEFAULT NULL,
  `lock_autolock_mode` tinyint(4) DEFAULT NULL,
  `lock_directunlock_notification` tinyint(4) DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `highcontrast_css` tinyint(4) DEFAULT 0,
  `plannings` text DEFAULT NULL,
  `sync_field` varchar(255) DEFAULT NULL,
  `groups_id` int(10) unsigned NOT NULL DEFAULT 0,
  `users_id_supervisor` int(10) unsigned NOT NULL DEFAULT 0,
  `timezone` varchar(50) DEFAULT NULL,
  `default_dashboard_central` varchar(100) DEFAULT NULL,
  `default_dashboard_assets` varchar(100) DEFAULT NULL,
  `default_dashboard_helpdesk` varchar(100) DEFAULT NULL,
  `default_dashboard_mini_ticket` varchar(100) DEFAULT NULL,
  `default_central_tab` tinyint(4) DEFAULT 0,
  `nickname` varchar(255) DEFAULT NULL,
  `substitution_end_date` timestamp NULL DEFAULT NULL,
  `substitution_start_date` timestamp NULL DEFAULT NULL,
  `toast_location` varchar(255) DEFAULT NULL,
  `timeline_action_btn_layout` tinyint(4) DEFAULT NULL,
  `timeline_date_format` tinyint(4) DEFAULT NULL,
  `2fa` text DEFAULT NULL,
  `2fa_unenforced` tinyint(4) NOT NULL DEFAULT 0 COMMENT 'If 1, the user is excluded from 2FA enforcement policies',
  `password_history` longtext DEFAULT NULL,
  `is_notif_enable_default` tinyint(4) DEFAULT NULL,
  `show_search_form` tinyint(4) DEFAULT NULL,
  `search_pagination_on_top` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicityloginauth` (`name`,`authtype`,`auths_id`),
  KEY `firstname` (`firstname`),
  KEY `realname` (`realname`),
  KEY `entities_id` (`entities_id`),
  KEY `profiles_id` (`profiles_id`),
  KEY `locations_id` (`locations_id`),
  KEY `usertitles_id` (`usertitles_id`),
  KEY `usercategories_id` (`usercategories_id`),
  KEY `is_deleted` (`is_deleted`),
  KEY `is_active` (`is_active`),
  KEY `date_mod` (`date_mod`),
  KEY `authitem` (`authtype`,`auths_id`),
  KEY `is_deleted_ldap` (`is_deleted_ldap`),
  KEY `date_creation` (`date_creation`),
  KEY `begin_date` (`begin_date`),
  KEY `end_date` (`end_date`),
  KEY `sync_field` (`sync_field`),
  KEY `groups_id` (`groups_id`),
  KEY `users_id_supervisor` (`users_id_supervisor`),
  KEY `auths_id` (`auths_id`),
  KEY `default_requesttypes_id` (`default_requesttypes_id`),
  KEY `user_dn_hash` (`user_dn_hash`),
  KEY `substitution_end_date` (`substitution_end_date`),
  KEY `substitution_start_date` (`substitution_start_date`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_users` DISABLE KEYS */;
INSERT INTO `glpi_users` VALUES
(2,'glpi','$2y$12$pXxuh4rkxHBc2hh8RNUJz.HK5Putm/vmiZq5AMP1QpgKDKeXY0BC.',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,0,20,1,NULL,0,1,'2026-10-14 14:05:06','2026-10-13 17:03:13',NULL,0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ghs3RrKIxLK5TeSKSkZfcYPfoF4CmgMRyjfbjDgWPuKGH+niiHc7S25Zj4R/dsk+I9OU4K12vz6an76jWl3cWJGD2vC7LKsTFf7ShMvYS8M=','2026-10-13 17:43:18','kpbiCtjIXQy3nC3qWPbWzRtUgIvXPBzmqUe0WGOerNkJC+0HLjO6ofkGJ8ztE1tcYsAT6IzresAp+Q6biVisSmyJUjSt6nTzoZ0zl25bjn3+XUyJDFCp/VZvnmSPxB1VYGZ8ow==','2026-10-13 17:03:13',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL),
(3,'post-only','$2y$12$cA0JDbETshsq9ljjjw9I9u/rw1Gu1r61pJhzlRSX/MECdbyk4.vYW',NULL,NULL,NULL,NULL,NULL,NULL,0,'en_GB',0,20,1,NULL,0,1,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL),
(4,'tech','$2y$12$mc1tUBZ6Y2nFJbbuBZx0feu56wLNE9k5IzSo22dUWcxaZpVi68Vf2',NULL,NULL,NULL,NULL,NULL,NULL,0,'en_GB',0,20,1,NULL,0,1,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL),
(5,'normal','$2y$12$IT8siWqySvZPI/o.55kXG.qpqR0ciXORSiqcuYjwNq6VvcYrprmP6',NULL,NULL,NULL,NULL,NULL,NULL,0,'en_GB',0,20,1,NULL,0,1,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL),
(6,'glpi-system','',NULL,NULL,NULL,NULL,'Support',NULL,0,NULL,0,NULL,1,NULL,0,1,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL),
(7,'tech1','$2y$12$P.ZiC0.ym8zmfw1WHIMf1OH6NenRUoODqaO.WviG65v.HhCW/pTmW',NULL,NULL,NULL,NULL,'Tecnico','Uno',0,'es_ES',0,NULL,1,NULL,0,1,NULL,'2026-10-13 17:13:13',NULL,0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-10-13 17:13:13',0,NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL),
(8,'tech2','$2y$12$3G7IE3WmAXFBOUJwnIC4aOfG.wq6kFscRmgcRrpXwHZpyql9ohU1u',NULL,NULL,NULL,NULL,'Tecnico','Dos',0,'es_ES',0,NULL,1,NULL,0,1,NULL,'2026-10-13 17:13:13',NULL,0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-10-13 17:13:13',0,NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL),
(9,'user1','$2y$12$IQ1owWOfVxbcjByiKsmGf.mJqEFeFVXRNdDtVmqA5kyoTEZUNFxAC',NULL,NULL,NULL,NULL,'Usuario','Uno',0,'es_ES',0,NULL,1,NULL,0,1,NULL,'2026-10-13 17:13:13',NULL,0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-10-13 17:13:13',0,NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL),
(10,'external-caller',NULL,NULL,NULL,NULL,NULL,'External','Caller',0,NULL,0,NULL,1,NULL,0,1,NULL,'2026-10-13 19:21:27',NULL,0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-10-13 19:21:27',0,NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `glpi_users` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_usertitles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_usertitles` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_usertitles` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_usertitles` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_validationsteps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_validationsteps` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `minimal_required_validation_percent` tinyint(3) unsigned NOT NULL DEFAULT 100,
  `is_default` tinyint(4) NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  `comment` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_validationsteps` DISABLE KEYS */;
INSERT INTO `glpi_validationsteps` VALUES
(1,'Aprobación',100,1,'2026-10-13 17:00:53','2026-10-13 17:00:53','');
/*!40000 ALTER TABLE `glpi_validationsteps` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_validatorsubstitutes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_validatorsubstitutes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `users_id` int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Delegator user',
  `users_id_substitute` int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Substitute user',
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_id_users_id_substitute` (`users_id`,`users_id_substitute`),
  KEY `users_id_substitute` (`users_id_substitute`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_validatorsubstitutes` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_validatorsubstitutes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_virtualmachinestates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_virtualmachinestates` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL DEFAULT '',
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_virtualmachinestates` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_virtualmachinestates` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_virtualmachinesystems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_virtualmachinesystems` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL DEFAULT '',
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_virtualmachinesystems` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_virtualmachinesystems` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_virtualmachinetypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_virtualmachinetypes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL DEFAULT '',
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_virtualmachinetypes` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_virtualmachinetypes` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_vlans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_vlans` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `tag` int(11) NOT NULL DEFAULT 0,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `tag` (`tag`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_vlans` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_vlans` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_vobjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_vobjects` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `itemtype` varchar(100) DEFAULT NULL,
  `items_id` int(10) unsigned NOT NULL DEFAULT 0,
  `data` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`itemtype`,`items_id`),
  KEY `item` (`itemtype`,`items_id`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_vobjects` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_vobjects` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_webhookcategories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_webhookcategories` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `webhookcategories_id` int(10) unsigned NOT NULL DEFAULT 0,
  `completename` text DEFAULT NULL,
  `level` int(11) NOT NULL DEFAULT 0,
  `ancestors_cache` longtext DEFAULT NULL,
  `sons_cache` longtext DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unicity` (`webhookcategories_id`,`name`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`),
  KEY `level` (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_webhookcategories` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_webhookcategories` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_webhooks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_webhooks` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `webhookcategories_id` int(10) unsigned NOT NULL DEFAULT 0,
  `itemtype` varchar(255) DEFAULT NULL,
  `event` varchar(255) DEFAULT NULL,
  `payload` longtext DEFAULT NULL,
  `use_default_payload` tinyint(4) NOT NULL DEFAULT 1,
  `custom_headers` text DEFAULT NULL,
  `url` text DEFAULT NULL,
  `secret` text DEFAULT NULL,
  `use_cra_challenge` tinyint(4) NOT NULL DEFAULT 0,
  `http_method` varchar(255) DEFAULT 'POST',
  `sent_try` tinyint(4) NOT NULL DEFAULT 3,
  `expiration` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(4) NOT NULL DEFAULT 0,
  `save_response_body` tinyint(4) NOT NULL DEFAULT 0,
  `log_in_item_history` tinyint(4) NOT NULL DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `use_oauth` tinyint(4) NOT NULL DEFAULT 0,
  `oauth_url` varchar(255) DEFAULT NULL,
  `clientid` varchar(255) DEFAULT NULL,
  `clientsecret` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `is_active` (`is_active`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `use_cra_challenge` (`use_cra_challenge`),
  KEY `date_creation` (`date_creation`),
  KEY `date_mod` (`date_mod`),
  KEY `webhookcategories_id` (`webhookcategories_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_webhooks` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_webhooks` ENABLE KEYS */;
DROP TABLE IF EXISTS `glpi_wifinetworks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `glpi_wifinetworks` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entities_id` int(10) unsigned NOT NULL DEFAULT 0,
  `is_recursive` tinyint(4) NOT NULL DEFAULT 0,
  `name` varchar(255) DEFAULT NULL,
  `essid` varchar(255) DEFAULT NULL,
  `mode` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `date_mod` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `entities_id` (`entities_id`),
  KEY `is_recursive` (`is_recursive`),
  KEY `essid` (`essid`),
  KEY `name` (`name`),
  KEY `date_mod` (`date_mod`),
  KEY `date_creation` (`date_creation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `glpi_wifinetworks` DISABLE KEYS */;
/*!40000 ALTER TABLE `glpi_wifinetworks` ENABLE KEYS */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

