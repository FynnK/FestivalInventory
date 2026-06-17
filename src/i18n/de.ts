export const de: Record<string, string> = {
  // Offline banner
  offline_banner_message: 'Sie sind derzeit offline. Änderungen werden synchronisiert, wenn die Verbindung wiederhergestellt ist.',

  // Tabs
  tab_inventory: 'Inventar',
  tab_stages: 'Bühnen',
  tab_ledger: 'Buchhaltung',
  tab_reports: 'Berichte',

  // Sidebar
  sidebar_scan_barcode_heading: 'Barcode scannen',
  sidebar_barcode_placeholder: 'Barcode tippen oder scannen...',
  sidebar_import_mode_label: 'Importmodus',
  sidebar_import_mode_on: 'AN',
  sidebar_import_mode_off: 'AUS',
  sidebar_import_mode_hint: 'Scannen fügt Artikel zum Bestand hinzu. Unbekannte Barcodes öffnen das Hinzufügen-Formular.',
  sidebar_bulk_import_button: 'Stapelimport',

  // Toast messages
  toast_item_out_of_stock: '{name} ist nicht auf Lager.',
  toast_added_1_to_item: '1 zu {name} hinzugefügt',
  toast_select_stage_first: 'Wählen Sie zuerst eine Bühne aus.',
  toast_no_items_at_stage: 'Keine Artikel an dieser Bühne zum Zurückgeben.',
  toast_returned_qty_item: '{qty}x {name} zurückgegeben',
  toast_return_failed: 'Rückgabe fehlgeschlagen.',
  toast_cart_empty: 'Warenkorb ist leer.',
  toast_create_stage_first: 'Erstellen Sie zuerst eine Bühne vor dem Auschecken.',
  toast_checked_out_items: '{count} Artikel an {stage} ausgecheckt.',
  toast_checkout_insufficient_stock: '{count} Artikel fehlgeschlagen — unzureichender Bestand.',
  toast_stock_updated_checkout_done: 'Bestand aktualisiert und Checkout abgeschlossen.',
  toast_item_updated: 'Artikel aktualisiert.',
  toast_barcode_already_exists: 'Barcode existiert bereits.',
  toast_item_added: 'Artikel hinzugefügt.',
  toast_item_deleted: '{name} gelöscht',
  toast_stage_added: 'Bühne "{name}" hinzugefügt.',
  toast_stage_name_exists: 'Bühnenname existiert bereits.',
  toast_stage_deleted: 'Bühne "{name}" gelöscht. Artikel zurück auf Lager.',
  toast_exported_excel: 'Nach Excel exportiert.',
  toast_export_excel_failed: 'Excel-Export fehlgeschlagen.',
  toast_data_exported: 'Daten exportiert.',
  toast_export_failed: 'Export fehlgeschlagen.',
  toast_data_imported: 'Daten erfolgreich importiert.',
  toast_import_failed_format: 'Import fehlgeschlagen: ungültiges Format.',
  toast_sample_data_loaded: 'Beispieldaten geladen.',
  toast_database_cleared: 'Datenbank geleert.',
  toast_transaction_reversed: 'Transaktion rückgängig gemacht.',
  toast_reverse_insufficient_stock: 'Kann nicht rückgängig gemacht werden — unzureichender Bestand.',

  // Stages view
  stages_overview_heading: 'Bühnen-Übersicht',
  stages_table_header_item: 'Artikel',
  stages_table_header_total_out: 'Ausgegeben',
  stages_table_header_remaining: 'Verbleibend',
  stages_no_items: 'Keine Artikel zum Anzeigen.',
  stages_total_consumed: 'Verbraucht gesamt',

  // Reports view
  reports_heading: 'Berichte & Daten',
  reports_export_heading: 'Export',
  reports_export_excel_button: 'Nach Excel exportieren',
  reports_export_json_button: 'Als JSON exportieren',
  reports_import_heading: 'Import',
  reports_import_json_button: 'Aus JSON importieren',
  reports_load_sample_data_button: 'Beispieldaten laden',
  reports_burn_rate_heading: 'Verbrauchsrate (Letzte 7 Tage)',
  reports_burn_rate_unit: '/Tag',
  reports_danger_zone_heading: 'Gefahrenzone',
  reports_danger_zone_description: 'Das Leeren der Datenbank löscht dauerhaft alle Artikel, Bühnen, Teams und Transaktionshistorie. Dies kann nicht rückgängig gemacht werden.',
  reports_clear_database_button: 'Datenbank leeren / Zurücksetzen',

  // Modals - common
  modal_cancel: 'Abbrechen',

  // Modal - delete item
  modal_delete_item_title: 'Artikel löschen',
  modal_delete_item_message: 'Möchten Sie "{name}" wirklich löschen? Dies kann nicht rückgängig gemacht werden.',
  modal_confirm_delete: 'Löschen',

  // Modal - add stage
  modal_add_stage_title: 'Bühne hinzufügen',
  modal_confirm_add: 'Hinzufügen',
  modal_add_stage_placeholder: 'Bühnenname',

  // Modal - delete stage
  modal_delete_stage_title: 'Bühne löschen',
  modal_delete_stage_message: 'Diese Bühne löschen? Alle zugewiesenen Artikel werden zurück auf Lager gegeben.',
  modal_confirm_delete_stage: 'Bühne löschen',

  // Modal - checkout stage picker
  modal_select_destination_title: 'Ziel auswählen',
  modal_select_destination_message: 'Wählen Sie eine Bühne für den Auscheck-Artikel:',
  modal_no_stages_created: 'Noch keine Bühnen erstellt. Erstellen Sie zuerst eine Bühne.',

  // Modal - checkout review
  modal_checkout_review_title: 'Checkout-Übersicht',
  modal_checkout_review_message_prefix: 'Auschecken an',
  modal_checkout_total_items: 'Artikel gesamt:',
  modal_confirm_checkout: 'Checkout bestätigen',

  // Modal - insufficient stock (single item)
  modal_insufficient_stock_title: 'Unzureichender Bestand',
  modal_insufficient_stock_available: 'Nur {remaining} von {name} verfügbar.',
  modal_insufficient_stock_prompt: 'Bestand hinzufügen, um Menge auf {desiredQty} zu erhöhen?',
  modal_add_to_stock_button: '{count} auf Lager hinzufügen',

  // Modal - unknown barcode
  modal_unknown_barcode_title: 'Unbekannter Barcode',
  modal_unknown_barcode_message: 'Barcode {barcode} wurde nicht im Inventar gefunden.',
  modal_unknown_barcode_suggestion: 'Zum Importmodus wechseln, um diesen Artikel hinzuzufügen?',
  modal_import_item_button: 'Artikel importieren',
  modal_abort_button: 'Abbrechen',

  // Modal - checkout shortage
  modal_checkout_shortage_title: 'Unzureichender Bestand',
  modal_checkout_shortage_message: 'Die folgenden Artikel haben nicht genügend Bestand für diesen Checkout:',
  modal_checkout_shortage_need_have: 'Benötigt {requested} — Vorhanden {available}',
  modal_checkout_shortage_short_by: 'Fehlt {shortage}',
  modal_checkout_shortage_offer: 'Möchten Sie {total} Einheiten zum Inventar hinzufügen, um diese Bestellung zu erfüllen?',
  modal_add_stock_and_checkout_button: 'Bestand hinzufügen & Auschecken',

  // Modal - clear database
  modal_clear_database_title: 'Datenbank leeren',
  modal_clear_database_message: 'Dies löscht dauerhaft ALLE Artikel, Bühnen, Teams, Benutzer und die Transaktionshistorie. Dies kann nicht rückgängig gemacht werden. Sind Sie absolut sicher?',
  modal_confirm_clear_everything: 'Alles löschen',

  // Cart
  cart_heading: 'Warenkorb',
  cart_summary: '{count} Artikel ({total} gesamt)',
  cart_empty_line1: 'Noch keine Artikel gescannt.',
  cart_empty_line2: 'Scannen Sie Barcodes, um Ihren Warenkorb zu füllen.',
  cart_clear_button: 'Warenkorb leeren',
  cart_checkout_button: 'Auschecken',
  cart_no_stage_warning: 'Wählen Sie eine Bühne oder wählen Sie eine beim Auschecken aus.',

  // Crew selector
  crew_selector_heading: 'Bühnen / Teams',
  crew_selector_add_button: 'Hinzufügen',
  crew_selector_no_stages: 'Noch keine Bühnen.',

  // Bulk import
  bulk_import_title: 'Stapelimport',
  bulk_import_type_label: 'Importtyp',
  bulk_import_type_items: 'Artikel (Inventar)',
  bulk_import_type_stages: 'Bühnen',
  bulk_import_type_crews: 'Teams',
  bulk_import_type_users: 'Benutzer',
  bulk_import_upload_label: 'Datei hochladen (CSV oder Excel)',
  bulk_import_click_to_select: 'Klicken Sie, um eine Datei auszuwählen',
  bulk_import_preview_label: 'Vorschau (erste 5 Zeilen)',
  bulk_import_success_count: '{count} Artikel erfolgreich importiert',
  bulk_import_more_errors: '...und {count} weitere Fehler',
  bulk_import_close_button: 'Schließen',
  bulk_import_importing: 'Importiere...',
  bulk_import_data_button: 'Daten importieren',

  // Transaction history
  txn_search_placeholder: 'Suche nach Artikel, Barcode, Bühne, Notiz...',
  txn_filter_all_types: 'Alle Typen',
  txn_filter_issues: 'Nur Ausgaben',
  txn_filter_returns: 'Nur Rückgaben',
  txn_count_display: '{filtered} von {total} Transaktionen',
  txn_no_transactions: 'Keine Transaktionen gefunden',
  txn_table_header_time: 'Zeit',
  txn_table_header_type: 'Typ',
  txn_table_header_item: 'Artikel',
  txn_table_header_stage: 'Bühne',
  txn_table_header_user_crew: 'Benutzer/Team',
  txn_table_header_qty: 'Menge',
  txn_table_header_note: 'Notiz',
  txn_type_issue: 'Ausgabe',
  txn_type_return: 'Rückgabe',
  txn_type_adjustment: 'Korr.',
  txn_reverse_title: 'Transaktion rückgängig machen',
  txn_reverse_description: 'Erstellen Sie einen umkehrenden Eintrag für {type} von {qty}x {item} an {stage}',
  txn_reverse_reason_label: 'Grund / Kommentar',
  txn_reverse_reason_placeholder: 'Warum machen Sie dies rückgängig?',
  txn_reverse_cancel_button: 'Abbrechen',
  txn_reverse_confirm_button: 'Rückgängig',
  txn_reverse_tooltip: 'Diese Transaktion rückgängig machen',

  // Inventory matrix
  inventory_search_placeholder: 'Barcode, Name suchen...',
  inventory_filter_all_categories: 'Alle Kategorien',
  inventory_add_item_button: 'Artikel hinzufügen',
  inventory_no_match_filters: 'Keine Artikel entsprechen Ihren Filtern',
  inventory_no_items: 'Keine Artikel im Inventar',
  inventory_filter_unreturned: 'Nicht zurückgegebene Leihgaben',
  inventory_table_header_barcode: 'Barcode',
  inventory_table_header_name: 'Name',
  inventory_table_header_category: 'Kategorie',
  inventory_table_header_stock: 'Bestand',
  inventory_table_header_status: 'Status',
  inventory_table_header_at_stage: 'An Bühne',
  inventory_table_header_actions: 'Aktionen',
  inventory_item_type_rental: 'Miete',
  inventory_action_cart: 'Warenkorb',
  inventory_action_return: 'Zurückgeben',

  // Edit item modal
  edit_modal_title_add: 'Neuen Artikel hinzufügen',
  edit_modal_title_edit: 'Artikel bearbeiten',
  edit_field_barcode_label: 'Barcode',
  edit_field_barcode_placeholder: 'Barcode scannen oder eingeben',
  edit_field_item_type_label: 'Artikeltyp',
  edit_field_item_type_consumable: 'Verbrauchsgut',
  edit_field_item_type_rental: 'Miete / Nachverfolgbar',
  edit_field_name_label: 'Name',
  edit_field_name_placeholder: 'Artikelname',
  edit_field_category_label: 'Kategorie',
  edit_field_category_placeholder: 'z.B. Hardware, Kabel, Verbrauchsgüter...',
  edit_field_category_new: 'Neue Kategorie',
  edit_field_description_label: 'Beschreibung',
  edit_field_description_placeholder: 'Optionale Beschreibung',
  edit_field_serial_number_label: 'Seriennummer',
  edit_field_serial_number_placeholder: 'Hersteller-Seriennummer',
  edit_field_unique_id_label: 'Eindeutige ID',
  edit_field_unique_id_placeholder: 'Interner Asset-Tag',
  edit_field_owner_label: 'Eigentümer',
  edit_field_owner_placeholder: 'z.B. Festival, Lieferant A, Lieferant B',
  edit_field_total_qty_label: 'Gesamtmenge',
  edit_field_low_stock_label: 'Niedriger Bestand bei',
  edit_field_units_per_package_label: 'Einheiten pro Packung',
  edit_field_unit_type_label: 'Einheitstyp',
  edit_field_unit_type_placeholder: 'Stk., Meter, etc.',
  edit_error_name_barcode_required: 'Name und Barcode sind erforderlich.',
  edit_error_total_negative: 'Gesamtmenge kann nicht negativ sein.',
  edit_error_total_below_issued: 'Gesamtmenge kann nicht unter die aktuelle Ausgabemenge ({remaining} im Umlauf) liegen.',
  edit_confirm_add_button: 'Artikel hinzufügen',
  edit_confirm_save_button: 'Änderungen speichern',

  // Categories
  category_hardware: 'Hardware',
  category_cables: 'Kabel',
  category_consumables: 'Verbrauchsgüter',
  category_electronics: 'Elektronik',
  category_safety: 'Sicherheit',
  category_general: 'Allgemein',

  // Return modal
  return_modal_title: 'Zurück auf Lager',
  return_modal_from_stage: 'Rückgabe von {stage}',
  return_modal_max_returnable: 'Max. rückgebbar: {max} Einheiten',
  return_confirm_button: '{qty} zurückgeben',

  // Top bar
  topbar_app_title: 'Festival Inventar',
  topbar_item_count: '{count} Artikel',
  modal_seed_title: 'Beispieldaten laden?',
  modal_seed_message: 'Alle aktuellen Daten werden gelöscht und durch Beispieldaten ersetzt. Dies kann nicht rückgängig gemacht werden. Fortfahren?',
  modal_seed_confirm: 'Ja, Beispieldaten laden',
  topbar_export_button: 'Export',
  topbar_import_button: 'Import',
  topbar_excel_button: 'Excel',

  // Scanner
  scanner_heading: 'Webcam-Scanner',
  scanner_start_camera_button: 'Kamera starten',
  scanner_stop_button: 'Stoppen',
  scanner_error_start_failed: 'Kamera konnte nicht gestartet werden',
  scanner_request_permission_button: 'Kamera-Berechtigung anfordern',
  scanner_detected_label: 'Gescannt:',
  scanner_confirm_scan_button: 'Barcode verwenden',

  // Confirmation modal
  modal_confirm_default: 'Bestätigen',
  modal_cancel_default: 'Abbrechen',

  // Stock badge
  badge_out_of_stock: 'Nicht auf Lager',
  badge_low_stock: 'Wenig Lager',
  badge_in_stock: 'Auf Lager',

  // Stock reduction confirmation
  stock_reduction_title: 'Bestand reduzieren?',
  stock_reduction_message: 'Änderung von {oldTotal} auf {newTotal} erzeugt einen Korrektureintrag.',
  stock_reduction_warning: 'Dies reduziert den verfügbaren Bestand. Fortfahren?',
  stock_reduction_confirm: 'Ja, Bestand reduzieren',

  // Rental return
  rental_return_modal_title: 'Leihgegenstand zurücknehmen',
  rental_return_modal_message: 'Wähle die Bühne, von der "{name}" zurückkommt:',

  // Remote scanner
  remote_scanner_heading: 'Remote-Scanner',
  remote_scanner_off: 'AUS',
  remote_scanner_waiting: 'Warte…',
  remote_scanner_connected: 'Verbunden',
  remote_scanner_scan_instruction: 'Scanne den QR-Code mit deinem Telefon, um als Remote-Scanner zu verbinden.',
  remote_scanner_phone_connected: 'Telefon verbunden. Scans vom Telefon erscheinen hier.',
  remote_scanner_generating: 'Generiere QR-Code…',
  remote_scanner_connecting: 'Verbinde…',
  remote_scanner_connection_error: 'Verbindung fehlgeschlagen: {error}',
  remote_scanner_view_toggle_scanner: 'Scanner-Ansicht',
  remote_scanner_view_toggle_full: 'Volle Ansicht',
  remote_scanner_recent_scans: 'Letzte Scans',
  remote_scanner_no_scans: 'Noch keine Scans.',
  remote_scanner_phone_bar: 'Als Remote-Scanner verbunden',
}
