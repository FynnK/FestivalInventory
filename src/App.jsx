import React, { useState, useEffect, useRef } from 'react';
import {
  Barcode, Plus, Minus, Warehouse, Tent, CheckCircle, XCircle,
  Info, Trash2, AlertTriangle, Printer, ScanLine, ShoppingCart,
  ListChecks, ArrowLeftRight, Download, Edit, Wrench, Camera
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import * as XLSX from 'xlsx';
import './App.css';

// Mock Data
const INITIAL_STAGES = ['Main Stage', 'Techno Tent', 'Acoustic Lounge', 'Cosmic Meadow', 'Warehouse'];
const INITIAL_INVENTORY = [
  {
    id: '84729103847',
    name: 'Screws (Box of 1000)',
    total: 10,
    remaining: 5,
    usage: { 'Main Stage': 3, 'Techno Tent': 2 },
    unitQuantity: 1000,
    unitType: 'screws per box',
    description: 'Standard wood screws, 2.5cm length'
  },
  {
    id: '98347502918',
    name: 'Gaffer Tape Roll (Black)',
    total: 50,
    remaining: 22,
    usage: { 'Main Stage': 10, 'Techno Tent': 8, 'Acoustic Lounge': 10 },
    unitQuantity: 50,
    unitType: 'meters per roll',
    description: 'Professional grade gaffer tape, 50mm width'
  },
  {
    id: '19283740192',
    name: 'XLR Cable (10ft)',
    total: 100,
    remaining: 100,
    usage: {},
    unitQuantity: 1,
    unitType: 'cable',
    description: 'Professional XLR audio cable, 10 feet length'
  },
  {
    id: '58473625198',
    name: 'Power Strip (6-outlet)',
    total: 30,
    remaining: 15,
    usage: { 'Warehouse': 15 },
    unitQuantity: 6,
    unitType: 'outlets per strip',
    description: 'Heavy duty power strip with surge protection'
  }
];

// Toast Component
const Toast = ({ toast, onClose }) => {
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show, onClose]);

  if (!toast.show) return null;

  const bgColor = toast.type === 'success' ? 'bg-green-600' :
    toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600';

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in`}>
      {toast.message}
    </div>
  );
};

// Modal Component
const Modal = ({ isOpen, onClose, title, children, className = '' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
      <div className={`glass-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto ${className}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XCircle size={24} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// Button Component
const Button = ({ variant = 'primary', size = 'md', children, className = '', disabled = false, ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 rounded-lg';

  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-pink-600 hover:bg-pink-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'bg-gray-600 hover:bg-gray-700 text-white'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${disabledClasses} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

// Input Component
const Input = React.forwardRef(({ label, className = '', ...props }, ref) => {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-300">{label}</label>}
      <input
        ref={ref}
        className={`w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
        {...props}
      />
    </div>
  );
});

// Select Component
const Select = ({ label, children, className = '', ...props }) => {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-300">{label}</label>}
      <select
        className={`w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
};

function App() {
  // State Management
  const [inventory, setInventory] = useState(() =>
    JSON.parse(localStorage.getItem('festivalInventory')) || INITIAL_INVENTORY
  );
  const [stages, setStages] = useState(() =>
    JSON.parse(localStorage.getItem('festivalStages')) || INITIAL_STAGES
  );
  const [barcode, setBarcode] = useState('');
  const [selectedStage, setSelectedStage] = useState(stages[0] || '');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [page, setPage] = useState('inventory');
  const [receiptItems, setReceiptItems] = useState([]);

  // Modal states
  const [newItemModal, setNewItemModal] = useState(false);
  const [newItemInfo, setNewItemInfo] = useState({
    id: '',
    name: '',
    quantity: 1,
    unitQuantity: 1,
    unitType: '',
    description: ''
  });
  const [detailedViewItem, setDetailedViewItem] = useState(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ show: false, item: null });
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [deleteStageConfirmModal, setDeleteStageConfirmModal] = useState({ show: false, stageName: null });
  const [adjustStageModal, setAdjustStageModal] = useState({ show: false, stageName: null, items: [] });
  const [stageAdjustments, setStageAdjustments] = useState({});
  const [addStockModal, setAddStockModal] = useState(false);
  const [stockItemInfo, setStockItemInfo] = useState({ id: '', quantity: 1 });

  // Camera scanner state
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isImportMode, setIsImportMode] = useState(false);
  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);
  const barcodeInputRef = useRef(null);

  // Effects
  useEffect(() => {
    localStorage.setItem('festivalInventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('festivalStages', JSON.stringify(stages));
  }, [stages]);

  useEffect(() => {
    const isAnyModalOpen = newItemModal || deleteConfirmModal.show || showReceiptModal ||
      deleteStageConfirmModal.show || adjustStageModal.show ||
      showCameraScanner || addStockModal;
    if (page === 'inventory' && !isAnyModalOpen) {
      barcodeInputRef.current?.focus();
    }
  }, [page, newItemModal, deleteConfirmModal, showReceiptModal, deleteStageConfirmModal,
    adjustStageModal, showCameraScanner, addStockModal]);

  // Helper Functions
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const closeToast = () => {
    setToast({ show: false, message: '', type: 'success' });
  };

  // Camera Scanner Logic
  const startCameraScan = () => {
    setShowCameraScanner(true);
    setCameraError(null);

    setTimeout(() => {
      const qrCodeSuccessCallback = (decodedText) => {
        setBarcode(decodedText);
        stopCameraScan();
        const item = inventory.find(i => i.id === decodedText);
        if (!item) {
          setNewItemInfo({
            id: decodedText,
            name: '',
            quantity: 1,
            unitQuantity: 1,
            unitType: '',
            description: ''
          });
          setNewItemModal(true);
          showToast('Scanned new item. Please add details.', 'info');
        } else {
          setTimeout(() => barcodeInputRef.current?.form.requestSubmit(), 100);
        }
      };

      const qrCodeErrorCallback = () => {
        // Handle errors silently as this is called frequently
      };

      if (!Html5Qrcode) {
        setCameraError("Camera scanning library failed to load.");
        return;
      }

      html5QrCodeRef.current = new Html5Qrcode("qr-reader");

      Html5Qrcode.getCameras().then(cameras => {
        if (cameras && cameras.length) {
          html5QrCodeRef.current.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            qrCodeSuccessCallback,
            qrCodeErrorCallback
          ).catch(err => {
            console.error("Error starting camera:", err);
            if (err.name === 'NotAllowedError') {
              setCameraError("Camera access was denied. Please allow camera permissions in your browser settings.");
            } else {
              setCameraError("Failed to start camera. Make sure it's not in use by another app.");
            }
          });
        } else {
          setCameraError("No cameras found on this device.");
        }
      }).catch(() => {
        setCameraError("Could not get camera permissions. Please make sure you are on a secure (https) connection and grant access.");
      });
    }, 100);
  };

  const stopCameraScan = () => {
    if (html5QrCodeRef.current?.isScanning) {
      html5QrCodeRef.current.stop().then(() => {
        html5QrCodeRef.current.clear();
      }).catch(err => console.error("Failed to stop scanner.", err));
    }
    setShowCameraScanner(false);
  };

  // Inventory Logic
  const handleScan = (e) => {
    e.preventDefault();
    if (!barcode) return;

    const item = inventory.find(i => i.id === barcode);

    if (isImportMode) {
      if (item) {
        setInventory(prevInventory => prevInventory.map(invItem => {
          if (invItem.id === barcode) {
            return {
              ...invItem,
              total: invItem.total + 1,
              remaining: invItem.remaining + 1
            };
          }
          return invItem;
        }));
        showToast(`Added 1 unit to ${item.name}. Total: ${item.total + 1}`, 'success');
      } else {
        setNewItemInfo({
          id: barcode,
          name: '',
          quantity: 1,
          unitQuantity: 1,
          unitType: '',
          description: ''
        });
        setNewItemModal(true);
        showToast('Scanned new item. Please add details to complete import.', 'info');
      }
      setBarcode('');
    } else {
      if (!item) {
        showToast('Item not found. Please add it first or switch to Import Mode.', 'error');
        setBarcode('');
        return;
      }

      setReceiptItems(currentItems => {
        const existingItemIndex = currentItems.findIndex(i => i.id === barcode);
        const newItems = existingItemIndex > -1
          ? currentItems.map((i, idx) => idx === existingItemIndex ? { ...i, quantity: i.quantity + 1 } : i)
          : [...currentItems, { ...item, quantity: 1 }];
        return newItems;
      });
      showToast(`Added ${item.name} to transaction`, 'info');
      setBarcode('');
    }
  };

  const handleAddNewItem = () => {
    if (!newItemInfo.name || !newItemInfo.id || newItemInfo.quantity < 1) {
      showToast('Please provide a valid ID, name and quantity.', 'error');
      return;
    }
    if (inventory.some(item => item.id === newItemInfo.id)) {
      showToast('Barcode ID already exists. Please use a unique ID.', 'error');
      return;
    }
    const newItem = {
      id: newItemInfo.id,
      name: newItemInfo.name,
      total: parseInt(newItemInfo.quantity, 10),
      remaining: parseInt(newItemInfo.quantity, 10),
      usage: {},
      unitQuantity: parseInt(newItemInfo.unitQuantity, 10) || 1,
      unitType: newItemInfo.unitType || '',
      description: newItemInfo.description || ''
    };
    setInventory([...inventory, newItem]);
    showToast(`New item added: ${newItem.name}`, 'success');
    setNewItemModal(false);
    setNewItemInfo({
      id: '',
      name: '',
      quantity: 1,
      unitQuantity: 1,
      unitType: '',
      description: ''
    });
  };

  const handleDeleteItem = (itemToDelete) => {
    setDeleteConfirmModal({ show: true, item: itemToDelete });
  };

  const confirmDeleteItem = () => {
    const { item } = deleteConfirmModal;
    const newInventory = inventory.filter(i => i.id !== item.id);
    setInventory(newInventory);
    showToast(`Deleted ${item.name}`, 'success');
    setDeleteConfirmModal({ show: false, item: null });
  };

  const handleAddStock = () => {
    if (!stockItemInfo.id || stockItemInfo.quantity < 1) {
      showToast('Please provide a valid barcode and quantity.', 'error');
      return;
    }

    const item = inventory.find(i => i.id === stockItemInfo.id);
    if (!item) {
      showToast('Item not found. Please add it first.', 'error');
      return;
    }

    setInventory(prevInventory => prevInventory.map(invItem => {
      if (invItem.id === stockItemInfo.id) {
        return {
          ...invItem,
          total: invItem.total + parseInt(stockItemInfo.quantity, 10),
          remaining: invItem.remaining + parseInt(stockItemInfo.quantity, 10)
        };
      }
      return invItem;
    }));

    showToast(`Added ${stockItemInfo.quantity} units to ${item.name}`, 'success');
    setAddStockModal(false);
    setStockItemInfo({ id: '', quantity: 1 });
  };

  const handleFinalizeTransaction = () => {
    if (receiptItems.length === 0 || !selectedStage) {
      showToast('No items to process or stage not selected.', 'error');
      return;
    }

    const updatedInventory = [...inventory];
    let hasError = false;

    for (const receiptItem of receiptItems) {
      const invItem = updatedInventory.find(i => i.id === receiptItem.id);
      if (!invItem || invItem.remaining < receiptItem.quantity) {
        showToast(`Not enough stock for ${receiptItem.name}. Only ${invItem?.remaining || 0} available.`, 'error');
        hasError = true;
        break;
      }
    }

    if (hasError) return;

    for (const receiptItem of receiptItems) {
      const invItem = updatedInventory.find(i => i.id === receiptItem.id);
      invItem.remaining -= receiptItem.quantity;
      invItem.usage[selectedStage] = (invItem.usage[selectedStage] || 0) + receiptItem.quantity;
    }

    setInventory(updatedInventory);
    showToast(`Transaction completed for ${selectedStage}`, 'success');
    setReceiptItems([]);
    setShowReceiptModal(false);
  };

  const removeFromReceipt = (itemId) => {
    setReceiptItems(currentItems => currentItems.filter(item => item.id !== itemId));
  };

  const adjustReceiptQuantity = (itemId, change) => {
    setReceiptItems(currentItems =>
      currentItems.map(item => {
        if (item.id === itemId) {
          const newQuantity = Math.max(1, item.quantity + change);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  // Stage Management
  const handleAddStage = (e) => {
    e.preventDefault();
    if (!newStageName.trim()) {
      showToast('Stage name cannot be empty.', 'error');
      return;
    }
    if (stages.includes(newStageName.trim())) {
      showToast('Stage with this name already exists.', 'error');
      return;
    }
    const updatedStages = [...stages, newStageName.trim()];
    setStages(updatedStages);
    setNewStageName('');
    showToast(`Stage "${newStageName.trim()}" added.`, 'success');
  };

  const handleDeleteStage = (stageToDelete) => {
    setDeleteStageConfirmModal({ show: true, stageName: stageToDelete });
  };

  const confirmDeleteStage = () => {
    const { stageName } = deleteStageConfirmModal;
    const updatedStages = stages.filter(stage => stage !== stageName);

    const updatedInventory = inventory.map(item => {
      if (item.usage[stageName]) {
        const newUsage = { ...item.usage };
        const returnedQty = newUsage[stageName];
        delete newUsage[stageName];
        return { ...item, usage: newUsage, remaining: item.remaining + returnedQty };
      }
      return item;
    });

    setStages(updatedStages);
    setInventory(updatedInventory);
    showToast(`Stage "${stageName}" deleted. All items returned to stock.`, 'info');
    setDeleteStageConfirmModal({ show: false, stageName: null });
    if (selectedStage === stageName) {
      setSelectedStage(updatedStages[0] || '');
    }
  };

  // Export Functions
  const exportToExcel = () => {
    try {
      // Build header: static columns + one column per stage
      const stageHeaders = stages;
      const wsData = [
        [
          'Barcode ID',
          'Item Name',
          'Description',
          'Unit Quantity',
          'Unit Type',
          'Total Quantity',
          'Remaining',
          'Total Units Available',
          ...stageHeaders
        ]
      ];
      // Build rows
      inventory.forEach(item => {
        wsData.push([
          item.id,
          item.name,
          item.description || '',
          item.unitQuantity || '',
          item.unitType || '',
          item.total,
          item.remaining,
          item.unitQuantity ? (item.remaining * item.unitQuantity).toLocaleString() : '',
          ...stageHeaders.map(stage => item.usage[stage] || 0)
        ]);
      });
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Inventory");
      XLSX.writeFile(wb, "festival_inventory.xlsx");
      showToast('Inventory exported to Excel!', 'success');
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      showToast('Failed to export to Excel.', 'error');
    }
  };

  const saveData = () => {
    try {
      const dataToSave = { inventory, stages };
      const jsonString = JSON.stringify(dataToSave, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'festival_inventory.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Data saved to festival_inventory.json!', 'success');
    } catch (error) {
      console.error("Error saving data:", error);
      showToast('Failed to save data.', 'error');
    }
  };

  const handleLoadData = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const loadedData = JSON.parse(e.target.result);
        setInventory(loadedData.inventory || []);
        setStages(loadedData.stages || []);
        showToast('Data loaded successfully!', 'success');
      } catch (error) {
        showToast('Failed to parse JSON file. Please check file format.', 'error');
        console.error("Error loading file:", error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="glass-card m-4 p-4">
        <div className="flex flex-wrap items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPage('inventory')}
              className={`nav-btn ${page === 'inventory' ? 'active' : ''}`}
            >
              <Warehouse size={20} />
              Inventory
            </button>
            <button
              onClick={() => setPage('stages')}
              className={`nav-btn ${page === 'stages' ? 'active' : ''}`}
            >
              <Tent size={20} />
              Stages
            </button>
            <button
              onClick={() => setPage('reports')}
              className={`nav-btn ${page === 'reports' ? 'active' : ''}`}
            >
              <Printer size={20} />
              Reports
            </button>
          </div>
          {/* Buy Me a Coffee Button */}
          <div className="ml-auto">
            <a href="https://www.buymeacoffee.com/nonagonal" target="_blank" rel="noopener noreferrer">
              <img
                src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=nonagonal&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff"
                alt="Buy me a coffee"
                style={{ height: '40px' }}
              />
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-4">
        

        {page === 'inventory' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Transaction Panel */}
            <div className="lg:col-span-1 flex flex-col gap-8">
              <div className="glass-card p-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <ArrowLeftRight className="w-6 h-6 text-pink-400" /> Transaction
                </h2>

                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    id="importMode"
                    checked={isImportMode}
                    onChange={(e) => setIsImportMode(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="importMode" className="text-sm">Import Mode</label>
                </div>

                <form onSubmit={handleScan}>
                  <label htmlFor="barcode-scanner" className="block text-sm font-medium text-gray-300 mb-2">
                    1. Scan Items
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-grow">
                      <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        ref={barcodeInputRef}
                        id="barcode-scanner"
                        type="text"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        placeholder="Scan items..."
                        className="w-full bg-gray-800 border-2 border-gray-600 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
                      />
                    </div>
                    <button type="button" onClick={startCameraScan} className="btn btn-ghost p-3">
                      <Camera className="w-6 h-6" />
                    </button>
                  </div>
                </form>

                {!isImportMode && (
                  <div className="mt-4">
                    <label htmlFor="stage-select" className="block text-sm font-medium text-gray-300 mb-2">
                      2. Assign to Stage
                    </label>
                    <select
                      id="stage-select"
                      value={selectedStage}
                      onChange={(e) => setSelectedStage(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    >
                      {stages.length > 0 ? (
                        stages.map(stage => <option key={stage} value={stage}>{stage}</option>)
                      ) : (
                        <option value="" disabled>No stages available</option>
                      )}
                    </select>
                  </div>
                )}

                {!isImportMode && (
                  <Button
                    onClick={() => setShowReceiptModal(true)}
                    disabled={receiptItems.length === 0 || stages.length === 0}
                    className="w-full mt-4"
                    variant="secondary"
                  >
                    <ListChecks /> Finalize Transaction ({receiptItems.length})
                  </Button>
                )}

                {isImportMode && (
                  <div className="text-sm text-blue-400 bg-blue-900/20 p-3 rounded-lg mt-4">
                    <Info size={16} className="inline mr-2" />
                    Import Mode: Scanning will add items to inventory instead of creating transactions.
                  </div>
                )}

                <div className="relative flex py-5 items-center">
                  <div className="flex-grow border-t border-gray-600"></div>
                  <span className="flex-shrink mx-4 text-gray-400">Or</span>
                  <div className="flex-grow border-t border-gray-600"></div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button onClick={() => setNewItemModal(true)} className="w-full">
                    <Plus /> Add New Item
                  </Button>
                  <Button onClick={() => setAddStockModal(true)} className="w-full">
                    <Plus /> Add Stock
                  </Button>
                </div>
              </div>
            </div>

            {/* Inventory List */}
            <div className="lg:col-span-2">
              <div className="glass-card p-6">
                <h2 className="text-xl font-semibold mb-4">Inventory Items</h2>
                <div className="space-y-2">
                  {inventory.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                      <div className="flex-1">
                        <div className="font-medium text-white">{item.name}</div>
                        <div className="text-sm text-gray-400">ID: {item.id}</div>
                        {item.unitQuantity && item.unitType && (
                          <div className="text-xs text-green-400 mt-1">
                            {item.unitQuantity} {item.unitType}
                          </div>
                        )}
                        {item.description && (
                          <div className="text-xs text-gray-500 mt-1">
                            {item.description}
                          </div>
                        )}
                        {Object.keys(item.usage).length > 0 && (
                          <div className="text-xs text-blue-400 mt-1">
                            Usage: {Object.entries(item.usage).map(([stage, qty]) => `${stage}: ${qty}`).join(', ')}
                          </div>
                        )}
                      </div>
                      <div className="text-right mr-4">
                        <div className="font-medium text-white">{item.remaining}/{item.total}</div>
                        <div className="text-sm text-gray-400">Available/Total</div>
                        {item.unitQuantity && item.unitType && (
                          <div className="text-xs text-green-400">
                            {(item.remaining * item.unitQuantity).toLocaleString()} {item.unitType.split(' ')[0]} available
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => setDetailedViewItem(item)}
                          variant="ghost"
                        >
                          <Info size={16} />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDeleteItem(item)}
                          variant="danger"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {inventory.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      No items in inventory. Add some items to get started.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {page === 'stages' && (
          <div>
            <h1 className="text-3xl font-bold mb-6">Stage Management</h1>

            {/* Stage Usage Overview Table */}
            <div className="glass-card p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Stage Usage Overview</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                  <thead>
                    <tr>
                      <th className="px-2 py-1 border-b border-gray-700">Item</th>
                      {stages.map(stage => (
                        <th key={stage} className="px-2 py-1 border-b border-gray-700">{stage}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map(item => (
                      <tr key={item.id}>
                        <td className="px-2 py-1 border-b border-gray-800 font-medium text-white">{item.name}</td>
                        {stages.map(stage => (
                          <td key={stage} className="px-2 py-1 border-b border-gray-800 text-center">
                            {item.usage[stage] ? item.usage[stage] : 0}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="glass-card p-6">
                <h2 className="text-xl font-semibold mb-4">Add New Stage</h2>
                <form onSubmit={handleAddStage} className="space-y-4">
                  <Input
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                    placeholder="Enter stage name"
                    label="Stage Name"
                  />
                  <Button type="submit" className="w-full">
                    <Plus /> Add Stage
                  </Button>
                </form>
              </div>

              <div className="glass-card p-6">
                <h2 className="text-xl font-semibold mb-4">Existing Stages</h2>
                <div className="space-y-2">
                  {stages.map(stage => (
                    <div key={stage} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div className="font-medium">{stage}</div>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteStage(stage)}
                      >
                        <Trash2 size={16} />
                        Delete
                      </Button>
                    </div>
                  ))}
                  {stages.length === 0 && (
                    <div className="text-center py-4 text-gray-400">
                      No stages created yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {page === 'reports' && (
          <div>
            <h1 className="text-3xl font-bold mb-6">Reports & Data Management</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="glass-card p-6">
                <h2 className="text-xl font-semibold mb-4">Export Options</h2>
                <div className="space-y-4">
                  <Button onClick={exportToExcel} className="w-full">
                    <Download size={20} />
                    Export Inventory to Excel
                  </Button>
                  <Button onClick={saveData} variant="secondary" className="w-full">
                    <Download size={20} />
                    Save Data as JSON
                  </Button>
                </div>
              </div>

              <div className="glass-card p-6">
                <h2 className="text-xl font-semibold mb-4">Data Management</h2>
                <div className="space-y-4">
                  <Button onClick={handleLoadData} variant="ghost" className="w-full">
                    <Download size={20} />
                    Load Data from JSON
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Toast */}
      <Toast toast={toast} onClose={closeToast} />

      {/* Camera Scanner Modal */}
      <Modal
        isOpen={showCameraScanner}
        onClose={stopCameraScan}
        title="QR Code Scanner"
        className="max-w-lg"
      >
        {cameraError ? (
          <div className="text-center py-8">
            <AlertTriangle size={48} className="mx-auto mb-4 text-red-500" />
            <p className="text-red-400 mb-4">{cameraError}</p>
            <Button onClick={stopCameraScan}>Close</Button>
          </div>
        ) : (
          <div>
            <div id="qr-reader" className="mb-4"></div>
            <div className="text-center">
              <Button onClick={stopCameraScan} variant="ghost">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add New Item Modal */}
      <Modal
        isOpen={newItemModal}
        onClose={() => setNewItemModal(false)}
        title="Add New Item"
      >
        <div className="space-y-4">
          <Input
            label="Barcode ID"
            value={newItemInfo.id}
            onChange={(e) => setNewItemInfo({ ...newItemInfo, id: e.target.value })}
            placeholder="Enter barcode ID"
          />
          <Input
            label="Item Name"
            value={newItemInfo.name}
            onChange={(e) => setNewItemInfo({ ...newItemInfo, name: e.target.value })}
            placeholder="Enter item name"
          />
          <Input
            label="Description (Optional)"
            value={newItemInfo.description}
            onChange={(e) => setNewItemInfo({ ...newItemInfo, description: e.target.value })}
            placeholder="Brief description of the item"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Unit Quantity"
              type="number"
              min="1"
              value={newItemInfo.unitQuantity}
              onChange={(e) => setNewItemInfo({ ...newItemInfo, unitQuantity: parseInt(e.target.value) || 1 })}
              placeholder="e.g., 1000"
            />
            <Input
              label="Unit Type"
              value={newItemInfo.unitType}
              onChange={(e) => setNewItemInfo({ ...newItemInfo, unitType: e.target.value })}
              placeholder="e.g., screws per box"
            />
          </div>
          <Input
            label="Initial Quantity"
            type="number"
            min="1"
            value={newItemInfo.quantity}
            onChange={(e) => setNewItemInfo({ ...newItemInfo, quantity: parseInt(e.target.value) || 1 })}
            placeholder="How many units to add"
          />
          <div className="flex gap-2">
            <Button onClick={handleAddNewItem} className="flex-1">
              <Plus size={20} />
              Add Item
            </Button>
            <Button onClick={() => setNewItemModal(false)} variant="ghost">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Stock Modal */}
      <Modal
        isOpen={addStockModal}
        onClose={() => setAddStockModal(false)}
        title="Add Stock"
      >
        <div className="space-y-4">
          <Input
            label="Barcode ID"
            value={stockItemInfo.id}
            onChange={(e) => setStockItemInfo({ ...stockItemInfo, id: e.target.value })}
            placeholder="Enter barcode ID"
          />
          <Input
            label="Quantity to Add"
            type="number"
            min="1"
            value={stockItemInfo.quantity}
            onChange={(e) => setStockItemInfo({ ...stockItemInfo, quantity: parseInt(e.target.value) || 1 })}
          />
          <div className="flex gap-2">
            <Button onClick={handleAddStock} className="flex-1">
              <Plus size={20} />
              Add Stock
            </Button>
            <Button onClick={() => setAddStockModal(false)} variant="ghost">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Transaction Receipt Modal */}
      <Modal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        title={`Transaction for ${selectedStage}`}
        className="max-w-lg"
      >
        <div className="space-y-4">
          {receiptItems.length > 0 ? (
            <>
              <div className="space-y-2">
                {receiptItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-400">ID: {item.id}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => adjustReceiptQuantity(item.id, -1)}
                        variant="ghost"
                      >
                        <Minus size={16} />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        size="sm"
                        onClick={() => adjustReceiptQuantity(item.id, 1)}
                        variant="ghost"
                      >
                        <Plus size={16} />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => removeFromReceipt(item.id)}
                        variant="danger"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button onClick={handleFinalizeTransaction} className="flex-1" variant="success">
                  <CheckCircle size={20} />
                  Confirm Transaction
                </Button>
                <Button onClick={() => setShowReceiptModal(false)} variant="ghost">
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-400">
              No items in transaction.
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmModal.show}
        onClose={() => setDeleteConfirmModal({ show: false, item: null })}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete "{deleteConfirmModal.item?.name}"?</p>
          <div className="flex gap-2">
            <Button onClick={confirmDeleteItem} variant="danger" className="flex-1">
              <Trash2 size={20} />
              Delete
            </Button>
            <Button onClick={() => setDeleteConfirmModal({ show: false, item: null })} variant="ghost">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Stage Confirmation Modal */}
      <Modal
        isOpen={deleteStageConfirmModal.show}
        onClose={() => setDeleteStageConfirmModal({ show: false, stageName: null })}
        title="Confirm Delete Stage"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete stage "{deleteStageConfirmModal.stageName}"?</p>
          <p className="text-sm text-yellow-400">All items assigned to this stage will be returned to inventory.</p>
          <div className="flex gap-2">
            <Button onClick={confirmDeleteStage} variant="danger" className="flex-1">
              <Trash2 size={20} />
              Delete Stage
            </Button>
            <Button onClick={() => setDeleteStageConfirmModal({ show: false, stageName: null })} variant="ghost">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Item Detail Modal */}
      <Modal
        isOpen={!!detailedViewItem}
        onClose={() => setDetailedViewItem(null)}
        title="Item Details"
        className="max-w-lg"
      >
        {detailedViewItem && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{detailedViewItem.name}</h3>
              <p className="text-sm text-gray-400">ID: {detailedViewItem.id}</p>
              {detailedViewItem.description && (
                <p className="text-sm text-gray-300 mt-2">{detailedViewItem.description}</p>
              )}
            </div>

            {detailedViewItem.unitQuantity && detailedViewItem.unitType && (
              <div className="bg-green-900/20 p-3 rounded-lg">
                <p className="text-sm text-green-400 font-medium">Unit Information</p>
                <p className="text-green-300">{detailedViewItem.unitQuantity} {detailedViewItem.unitType}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Total Quantity</p>
                <p className="font-medium">{detailedViewItem.total}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Available</p>
                <p className="font-medium">{detailedViewItem.remaining}</p>
              </div>
            </div>

            {detailedViewItem.unitQuantity && detailedViewItem.unitType && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Total Units</p>
                  <p className="font-medium text-green-400">
                    {(detailedViewItem.total * detailedViewItem.unitQuantity).toLocaleString()} {detailedViewItem.unitType.split(' ')[0]}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Available Units</p>
                  <p className="font-medium text-green-400">
                    {(detailedViewItem.remaining * detailedViewItem.unitQuantity).toLocaleString()} {detailedViewItem.unitType.split(' ')[0]}
                  </p>
                </div>
              </div>
            )}

            {Object.keys(detailedViewItem.usage).length > 0 && (
              <div>
                <p className="text-sm text-gray-400 mb-2">Stage Usage</p>
                <div className="space-y-1">
                  {Object.entries(detailedViewItem.usage).map(([stage, qty]) => (
                    <div key={stage} className="flex justify-between text-sm bg-blue-900/20 p-2 rounded">
                      <span>{stage}</span>
                      <div className="text-right">
                        <span className="text-blue-400">{qty} units</span>
                        {detailedViewItem.unitQuantity && detailedViewItem.unitType && (
                          <div className="text-xs text-blue-300">
                            {(qty * detailedViewItem.unitQuantity).toLocaleString()} {detailedViewItem.unitType.split(' ')[0]}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={() => setDetailedViewItem(null)} variant="ghost" className="w-full">
              Close
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default App;

