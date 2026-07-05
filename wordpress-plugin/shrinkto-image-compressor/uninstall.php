<?php
/**
 * Clean up plugin options on uninstall. Compressed images and backups are
 * intentionally left in place - deleting user media on uninstall is rude.
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

delete_option( 'shrinkto_settings' );
delete_option( 'shrinkto_license' );
delete_option( 'shrinkto_total_saved' );
delete_transient( 'shrinkto_validating' );
