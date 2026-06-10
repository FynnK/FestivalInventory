export const en: Record<string, string> = {
  // Offline banner
  offline_banner_message: 'You are currently offline. Changes will sync when connection is restored.',

  // Tabs
  tab_inventory: 'Inventory',
  tab_stages: 'Stages',
  tab_ledger: 'Ledger',
  tab_reports: 'Reports',

  // Sidebar
  sidebar_scan_barcode_heading: 'Scan Barcode',
  sidebar_barcode_placeholder: 'Type or scan barcode...',
  sidebar_import_mode_label: 'Import Mode',
  sidebar_import_mode_on: 'ON',
  sidebar_import_mode_off: 'OFF',
  sidebar_import_mode_hint: 'Scanning adds items to stock. Unknown barcodes open the add-item form.',
  sidebar_bulk_import_button: 'Bulk Import',

  // Toast messages
  toast_item_out_of_stock: '{name} is out of stock.',
  toast_added_1_to_item: 'Added 1 to {name}',
  toast_select_stage_first: 'Select a stage first.',
  toast_no_items_at_stage: 'No items at this stage to return.',
  toast_returned_qty_item: 'Returned {qty}x {name}',
  toast_return_failed: 'Return failed.',
  toast_cart_empty: 'Cart is empty.',
  toast_create_stage_first: 'Create a stage first before checking out.',
  toast_checked_out_items: 'Checked out {count} item(s) to {stage}.',
  toast_checkout_insufficient_stock: '{count} item(s) failed — insufficient stock.',
  toast_stock_updated_checkout_done: 'Stock updated and checkout completed.',
  toast_item_updated: 'Item updated.',
  toast_barcode_already_exists: 'Barcode already exists.',
  toast_item_added: 'Item added.',
  toast_item_deleted: 'Deleted {name}',
  toast_stage_added: 'Stage "{name}" added.',
  toast_stage_name_exists: 'Stage name already exists.',
  toast_stage_deleted: 'Stage "{name}" deleted. Items returned to stock.',
  toast_exported_excel: 'Exported to Excel.',
  toast_export_excel_failed: 'Excel export failed.',
  toast_data_exported: 'Data exported.',
  toast_export_failed: 'Export failed.',
  toast_data_imported: 'Data imported successfully.',
  toast_import_failed_format: 'Import failed: invalid format.',
  toast_sample_data_loaded: 'Sample data loaded.',
  toast_database_cleared: 'Database cleared.',
  toast_transaction_reversed: 'Transaction reversed.',
  toast_reverse_insufficient_stock: 'Cannot reverse — insufficient stock.',

  // Stages view
  stages_overview_heading: 'Stage Usage Overview',
  stages_table_header_item: 'Item',
  stages_table_header_total_out: 'Total Out',
  stages_table_header_remaining: 'Remaining',
  stages_no_items: 'No items to display.',
  stages_total_consumed: 'Total Consumed',

  // Reports view
  reports_heading: 'Reports & Data',
  reports_export_heading: 'Export',
  reports_export_excel_button: 'Export to Excel',
  reports_export_json_button: 'Export as JSON',
  reports_import_heading: 'Import',
  reports_import_json_button: 'Import from JSON',
  reports_load_sample_data_button: 'Load Sample Data',
  reports_burn_rate_heading: 'Burn Rate (Last 7 Days)',
  reports_burn_rate_unit: '/day',
  reports_danger_zone_heading: 'Danger Zone',
  reports_danger_zone_description: 'Clearing the database will permanently delete all items, stages, and transaction history. This cannot be undone.',
  reports_clear_database_button: 'Clear / Reset Database',

  // Modals - common
  modal_cancel: 'Cancel',

  // Modal - delete item
  modal_delete_item_title: 'Delete Item',
  modal_delete_item_message: 'Are you sure you want to delete "{name}"? This cannot be undone.',
  modal_confirm_delete: 'Delete',

  // Modal - add stage
  modal_add_stage_title: 'Add Stage',
  modal_confirm_add: 'Add',
  modal_add_stage_placeholder: 'Stage name',

  // Modal - delete stage
  modal_delete_stage_title: 'Delete Stage',
  modal_delete_stage_message: 'Delete this stage? All items assigned will be returned to stock.',
  modal_confirm_delete_stage: 'Delete Stage',

  // Modal - checkout stage picker
  modal_select_destination_title: 'Select Destination',
  modal_select_destination_message: 'Choose a stage to check out items to:',
  modal_no_stages_created: 'No stages created yet. Add a stage first.',

  // Modal - checkout review
  modal_checkout_review_title: 'Checkout Review',
  modal_checkout_review_message: 'Checking out to {stage}',
  modal_checkout_total_items: 'Total items:',
  modal_confirm_checkout: 'Confirm Checkout',

  // Modal - insufficient stock (single item)
  modal_insufficient_stock_title: 'Insufficient Stock',
  modal_insufficient_stock_available: 'Only {remaining} of {name} available.',
  modal_insufficient_stock_prompt: 'Add stock to increase quantity to {desiredQty}?',
  modal_add_to_stock_button: 'Add {count} to Stock',

  // Modal - unknown barcode
  modal_unknown_barcode_title: 'Unknown Barcode',
  modal_unknown_barcode_message: 'Barcode {barcode} was not found in inventory.',
  modal_unknown_barcode_suggestion: 'Switch to Import Mode to add this item?',
  modal_import_item_button: 'Import Item',
  modal_abort_button: 'Abort',

  // Modal - checkout shortage
  modal_checkout_shortage_title: 'Insufficient Stock',
  modal_checkout_shortage_message: 'The following items don\'t have enough stock for this checkout:',
  modal_checkout_shortage_need_have: 'Need {requested} — Have {available}',
  modal_checkout_shortage_short_by: 'Short by {shortage}',
  modal_checkout_shortage_offer: 'Would you like to add {total} units to inventory to fulfill this order?',
  modal_add_stock_and_checkout_button: 'Add Stock & Checkout',

  // Modal - clear database
  modal_clear_database_title: 'Clear Database',
  modal_clear_database_message: 'This will permanently delete ALL items, stages, crews, users, and transaction history. This cannot be undone. Are you absolutely sure?',
  modal_confirm_clear_everything: 'Clear Everything',

  // Cart
  cart_heading: 'Shopping Cart',
  cart_summary: '{count} items ({total} total)',
  cart_empty_line1: 'No items scanned yet.',
  cart_empty_line2: 'Scan barcodes to build your cart.',
  cart_clear_button: 'Clear Cart',
  cart_checkout_button: 'Checkout',
  cart_no_stage_warning: 'Select a stage or choose one during checkout.',

  // Crew selector
  crew_selector_heading: 'Stages / Crews',
  crew_selector_add_button: 'Add',
  crew_selector_no_stages: 'No stages yet.',

  // Bulk import
  bulk_import_title: 'Bulk Import',
  bulk_import_type_label: 'Import Type',
  bulk_import_type_items: 'Items (Inventory)',
  bulk_import_type_stages: 'Stages',
  bulk_import_type_crews: 'Crews',
  bulk_import_type_users: 'Users',
  bulk_import_upload_label: 'Upload File (CSV or Excel)',
  bulk_import_click_to_select: 'Click to select file',
  bulk_import_preview_label: 'Preview (first 5 rows)',
  bulk_import_success_count: '{count} item(s) imported successfully',
  bulk_import_more_errors: '...and {count} more errors',
  bulk_import_close_button: 'Close',
  bulk_import_importing: 'Importing...',
  bulk_import_data_button: 'Import Data',

  // Transaction history
  txn_search_placeholder: 'Search by item, barcode, stage, note...',
  txn_filter_all_types: 'All Types',
  txn_filter_issues: 'Issues Only',
  txn_filter_returns: 'Returns Only',
  txn_count_display: '{filtered} of {total} transactions',
  txn_no_transactions: 'No transactions found',
  txn_table_header_time: 'Time',
  txn_table_header_type: 'Type',
  txn_table_header_item: 'Item',
  txn_table_header_stage: 'Stage',
  txn_table_header_user_crew: 'User/Crew',
  txn_table_header_qty: 'Qty',
  txn_table_header_note: 'Note',
  txn_type_issue: 'Issue',
  txn_type_return: 'Return',
  txn_type_adjustment: 'Adj.',
  txn_reverse_title: 'Reverse Transaction',
  txn_reverse_description: 'Create a reversing entry for {type} of {qty}x {item} at {stage}',
  txn_reverse_reason_label: 'Reason / Comment',
  txn_reverse_reason_placeholder: 'Why are you reversing this?',
  txn_reverse_cancel_button: 'Cancel',
  txn_reverse_confirm_button: 'Reverse',
  txn_reverse_tooltip: 'Reverse this transaction',

  // Inventory matrix
  inventory_search_placeholder: 'Search barcode, name...',
  inventory_filter_all_categories: 'All Categories',
  inventory_add_item_button: 'Add Item',
  inventory_no_match_filters: 'No items match your filters',
  inventory_no_items: 'No items in inventory',
  inventory_table_header_barcode: 'Barcode',
  inventory_table_header_name: 'Name',
  inventory_table_header_category: 'Category',
  inventory_table_header_stock: 'Stock',
  inventory_table_header_status: 'Status',
  inventory_table_header_at_stage: 'At Stage',
  inventory_table_header_actions: 'Actions',
  inventory_item_type_rental: 'Rental',
  inventory_action_cart: 'Cart',
  inventory_action_return: 'Return',

  // Edit item modal
  edit_modal_title_add: 'Add New Item',
  edit_modal_title_edit: 'Edit Item',
  edit_field_barcode_label: 'Barcode',
  edit_field_barcode_placeholder: 'Scan or enter barcode',
  edit_field_item_type_label: 'Item Type',
  edit_field_item_type_consumable: 'Consumable',
  edit_field_item_type_rental: 'Rental / Trackable',
  edit_field_name_label: 'Name',
  edit_field_name_placeholder: 'Item name',
  edit_field_category_label: 'Category',
  edit_field_category_placeholder: 'e.g. Hardware, Cables, Consumables...',
  edit_field_description_label: 'Description',
  edit_field_description_placeholder: 'Optional description',
  edit_field_serial_number_label: 'Serial Number',
  edit_field_serial_number_placeholder: 'Manufacturer serial',
  edit_field_unique_id_label: 'Unique ID',
  edit_field_unique_id_placeholder: 'Internal asset tag',
  edit_field_owner_label: 'Owner',
  edit_field_owner_placeholder: 'e.g. Festival, Vendor A, Vendor B',
  edit_field_total_qty_label: 'Total Qty',
  edit_field_low_stock_label: 'Low Stock At',
  edit_field_units_per_package_label: 'Units Per Package',
  edit_field_unit_type_label: 'Unit Type',
  edit_field_unit_type_placeholder: 'pcs, meters, etc.',
  edit_error_name_barcode_required: 'Name and barcode are required.',
  edit_error_total_negative: 'Total quantity cannot be negative.',
  edit_error_total_below_issued: 'Cannot set total below current issued quantity ({remaining} in circulation).',
  edit_confirm_add_button: 'Add Item',
  edit_confirm_save_button: 'Save Changes',

  // Categories
  category_hardware: 'Hardware',
  category_cables: 'Cables',
  category_consumables: 'Consumables',
  category_electronics: 'Electronics',
  category_safety: 'Safety',
  category_general: 'General',

  // Return modal
  return_modal_title: 'Return to Stock',
  return_modal_from_stage: 'Returning from {stage}',
  return_modal_max_returnable: 'Max returnable: {max} units',
  return_confirm_button: 'Return {qty}',

  // Top bar
  topbar_app_title: 'Festival Inventory',
  topbar_item_count: '{count} items',
  topbar_seed_button: 'Seed',
  topbar_export_button: 'Export',
  topbar_import_button: 'Import',
  topbar_excel_button: 'Excel',

  // Scanner
  scanner_heading: 'Webcam Scanner',
  scanner_start_camera_button: 'Start Camera',
  scanner_stop_button: 'Stop',
  scanner_error_start_failed: 'Failed to start camera',

  // Confirmation modal
  modal_confirm_default: 'Confirm',
  modal_cancel_default: 'Cancel',

  // Stock badge
  badge_out_of_stock: 'Out of Stock',
  badge_low_stock: 'Low Stock',
  badge_in_stock: 'In Stock',
}
