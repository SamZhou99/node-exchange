/*
Navicat MySQL Data Transfer

Source Server         : 本地
Source Server Version : 50562
Source Host           : localhost:3306
Source Database       : exchange_coin

Target Server Type    : MYSQL
Target Server Version : 50562
File Encoding         : 65001

Date: 2021-11-23 23:59:33
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for `group_category`
-- ----------------------------
DROP TABLE IF EXISTS `group_category`;
CREATE TABLE `group_category` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '用户组',
  `label` varchar(255) DEFAULT NULL COMMENT 'key',
  `value` varchar(255) DEFAULT NULL COMMENT 'value',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Records of group_category
-- ----------------------------

-- ----------------------------
-- Table structure for `invite_code`
-- ----------------------------
DROP TABLE IF EXISTS `invite_code`;
CREATE TABLE `invite_code` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL COMMENT '用户ID',
  `code` varchar(255) NOT NULL COMMENT '邀请码',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Records of invite_code
-- ----------------------------

-- ----------------------------
-- Table structure for `login_log`
-- ----------------------------
DROP TABLE IF EXISTS `login_log`;
CREATE TABLE `login_log` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned DEFAULT NULL COMMENT '用户ID',
  `user_agent` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '登录设备信息',
  `ip` varchar(255) DEFAULT NULL COMMENT '登录IP',
  `time` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '登录时间',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Records of login_log
-- ----------------------------

-- ----------------------------
-- Table structure for `page_view_log`
-- ----------------------------
DROP TABLE IF EXISTS `page_view_log`;
CREATE TABLE `page_view_log` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` int(11) unsigned DEFAULT NULL COMMENT '用户ID',
  `ip` varchar(255) DEFAULT NULL COMMENT 'IP',
  `referer` varchar(255) DEFAULT NULL COMMENT '来源页',
  `url` varchar(255) DEFAULT NULL COMMENT '当前页',
  `user_agent` varchar(255) DEFAULT NULL COMMENT '用户浏览设备',
  `create_datetime` timestamp NULL DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Records of page_view_log
-- ----------------------------

-- ----------------------------
-- Table structure for `system_wallet`
-- ----------------------------
DROP TABLE IF EXISTS `system_wallet`;
CREATE TABLE `system_wallet` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `upload_user_id` int(10) unsigned DEFAULT NULL COMMENT '上传者ID',
  `bind_user_id` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '绑定到用户ID',
  `wallet_address` varchar(255) DEFAULT '' COMMENT '系统钱包地址',
  `create_datetime` timestamp NULL DEFAULT NULL COMMENT '创建时间',
  `update_datetime` timestamp NULL DEFAULT NULL COMMENT '更新时间(爬虫更新数据时间)',
  PRIMARY KEY (`id`,`bind_user_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Records of system_wallet
-- ----------------------------

-- ----------------------------
-- Table structure for `trade_log`
-- ----------------------------
DROP TABLE IF EXISTS `trade_log`;
CREATE TABLE `trade_log` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `amount` int(255) unsigned DEFAULT NULL COMMENT '数量',
  `block` int(255) unsigned DEFAULT NULL COMMENT '块高度',
  `hash` varchar(255) DEFAULT NULL COMMENT '交易哈希-bitpie',
  `owner_address` varchar(255) DEFAULT NULL COMMENT '来源地址',
  `to_address` varchar(255) DEFAULT NULL COMMENT '到达地址',
  `time` timestamp NULL DEFAULT NULL COMMENT '区块链交易时间',
  `create_time` timestamp NULL DEFAULT NULL COMMENT '本条记录创建时间',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Records of trade_log
-- ----------------------------

-- ----------------------------
-- Table structure for `user`
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `parent_id` int(10) unsigned DEFAULT NULL COMMENT '上级ID',
  `account` varchar(255) DEFAULT '' COMMENT '帐号',
  `password` varchar(255) DEFAULT NULL COMMENT '密码',
  `type` varchar(255) DEFAULT NULL COMMENT '身份类型',
  `email` varchar(255) DEFAULT NULL COMMENT '邮箱',
  `mobile` varchar(255) DEFAULT NULL COMMENT '电话',
  `status` tinyint(4) unsigned DEFAULT NULL COMMENT '状态',
  `create_datetime` timestamp NULL DEFAULT NULL COMMENT '创建时间',
  `update_datetime` timestamp NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Records of user
-- ----------------------------

-- ----------------------------
-- Table structure for `user_group`
-- ----------------------------
DROP TABLE IF EXISTS `user_group`;
CREATE TABLE `user_group` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Records of user_group
-- ----------------------------

-- ----------------------------
-- Table structure for `user_wallet`
-- ----------------------------
DROP TABLE IF EXISTS `user_wallet`;
CREATE TABLE `user_wallet` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned DEFAULT NULL COMMENT '用户ID',
  `usdt` decimal(20,8) unsigned DEFAULT NULL COMMENT 'USDT',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Records of user_wallet
-- ----------------------------

-- ----------------------------
-- Table structure for `user_wallet_log`
-- ----------------------------
DROP TABLE IF EXISTS `user_wallet_log`;
CREATE TABLE `user_wallet_log` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Records of user_wallet_log
-- ----------------------------
