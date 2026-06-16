export const SKELETON_THEME = {
    light: {
        baseColor: "#E7E8ED", // BRAND.100
        highlightColor: "#F3F3F6", // BRAND.50
    },
    dark: {
        baseColor: "#212529", // DARK.800
        highlightColor: "#343A40", // DARK.700
    }
};

export const editBtnStyle = {
    btn: "bg-white text-BRAND-500 border !border-BRAND-500 hover:!bg-BRAND-500 hover:!text-white focus:!ring-0 dark:bg-DARK-900 dark:text-white dark:!border-DARK-400 dark:hover:!bg-DARK-500 dark:hover:text-white",
    icon: "h-5 w-5 !text-BRAND-500 group-hover:!text-white dark:!text-DARK-400 dark:group-hover:!text-white my-auto"
};

export const deleteBtnStyle = {
    btn: "bg-white text-ERROR border !border-ERROR hover:!bg-ERROR_HOVER hover:!text-white shadow-md hover:shadow-lg rounded-lg focus:!ring-0 dark:!bg-DARK-900 dark:!text-white dark:!border-red-500 dark:hover:!bg-ERROR_HOVER dark:hover:text-white",
    icon: "h-5 w-5 !text-ERROR group-hover:!text-white dark:!text-red-400 dark:group-hover:!text-white"
};

export const viewBtnStyle = {
    btn: "bg-white text-yellow-500 border border-yellow-500 hover:!bg-yellow-500 hover:!text-white focus:!ring-0 dark:bg-DARK-900 dark:text-white dark:border-yellow-400 dark:hover:bg-yellow-400 dark:hover:text-white",
    icon: "h-5 w-5 text-yellow-500 group-hover:text-white dark:text-DARK-500 dark:group-hover:text-white"
};

export const moreBtnStyle = {
    btn: "bg-white text-green-500 border border-green-500 hover:!bg-green-500 hover:!text-white focus:!ring-0 dark:bg-DARK-900 dark:text-white dark:border-green-400 dark:hover:bg-green-400 dark:hover:text-white",
    icon: "h-5 w-5 text-green-500 group-hover:text-white dark:text-DARK-500 dark:group-hover:text-white"
};

export const divContainerStyle = "px-4 sm:px-6 lg:px-8 flex flex-col gap-4";
// export const divContainerStyle = "container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-4";

export enum ModuleName {
    ALLOWED = "allowed",
    PAYMENTS = "payments",
    ORDERS = "orders",
    CUSTOMER = "customer",
    RESERVATION = "reservation",
    STAFFS = "Staffs",
    REPORTS = "reports",
    TAXES = "taxes",
    DISCOUNTS = "discounts",
    SETTINGS = "settings",
    INVENTORY = "inventory",
    COUPONS = "coupons",
    POS_DEVICE = "pos_device"
}

export const MANAGER_ROLES = ['Owner/Admin', "Owner/ Admin", 'Owner', 'Admin', 'Manager', 'Manager/Administrator', 'Administrator', 'Tech'];
export const SUPER_ADMIN = 'Super Admin';
export const OWNER_ROLES = ["Owner/ Admin", "Owner/Admin", "Owner", "Manager", "Super Admin"];
export const OWNER_ADMIN_ROLES = ["Owner/ Admin", "Owner/Admin", "Owner", "Super Admin"];

export const STATIC_ROLES = [
    { value: 'Owner/Admin', label: 'Owner/Admin' },
    { value: 'Admin', label: 'Admin' },
    { value: 'Manager', label: 'Manager' },
    { value: 'Cashier', label: 'Cashier' },
    { value: 'Server', label: 'Server' },
    { value: 'Chef', label: 'Chef' },
    { value: 'Tech', label: 'Tech' },
    { value: 'Bartender', label: 'Bartender' },
    { value: 'Waiter', label: 'Waiter' },
    { value: 'Owner', label: 'Owner' },
    { value: 'Staff', label: 'Staff' },
    { value: 'Busser', label: 'Busser' },
    { value: 'Cook', label: 'Cook' },
    { value: ' Prep Cook', label: 'Prep Cook' },
    { value: ' Line Cook', label: 'Line Cook' },
    { value: 'Dishwasher', label: 'Dishwasher' },
    { value: 'Create Profile', label: 'Create Profile' },
    { value: 'User', label: 'User' },
];

export const routePermissions = {
    "setting": ModuleName.SETTINGS,
    // "profile": "Staffs",
    "site-configs": ModuleName.SETTINGS,
    // "connection": ModuleName.ALLOWED,
    // "connection-status": "settings",
    "order": ModuleName.ORDERS,
    "product": ModuleName.INVENTORY,
    "category": ModuleName.INVENTORY,
    "modifire/category": ModuleName.INVENTORY,
    "room": ModuleName.SETTINGS,
    "discount": ModuleName.DISCOUNTS,
    "coupon": ModuleName.COUPONS,
    "modifier": ModuleName.INVENTORY,
    "customer": ModuleName.CUSTOMER,
    "staff": ModuleName.STAFFS,
    "role": ModuleName.STAFFS,
    "posdevice": ModuleName.POS_DEVICE,
    "table": ModuleName.SETTINGS,
    "business": ModuleName.SETTINGS,
    "restaurant": ModuleName.SETTINGS,
    "reservation": ModuleName.ORDERS,
    "clock": ModuleName.STAFFS,
    "report": ModuleName.REPORTS,
    "zip_code": ModuleName.SETTINGS,
    "security": ModuleName.SETTINGS,
    "meal_periods": ModuleName.INVENTORY,
    "tax": ModuleName.TAXES,
    "tender": ModuleName.SETTINGS
};

export enum ProductStatus {
    NEW = 'new',
    ACKNOWLEDGED = 'acknowledged',
    PREPARING = 'preparing',
    READY = 'ready',
    SERVED = 'served',
    HOLD = 'hold',
    CANCELLED = 'cancelled'
}

export const orderTypeMap: any = {
    "Quick Service": "quickService",
    "Table Plan": "table",
    "Delivery": "delivery",
    "Take out": "takeAway",
    "Bar": "bar"
};

export const FILE_SIZE_LIMIT = 20 // 20 mb

export const allowedImageExtensions = ["jpeg", "png", "gif", "webp", "avif", "jpg"];
export const allowedVideoExtensions = ["mp4", "webm", "ogg", "mkv", "avi", "mov"];


export const orderTypes: any = [
    { "name": "Product", "_id": "product", },
    { "name": "Table", "_id": "table", }
];

export const productTypes: any = [
    { "name": "Quick Service", "_id": "quickService", },
    { "name": "Delivery", "_id": "delivery", },
    { "name": "Take out", "_id": "takeAway", },
    { "name": "Bar tabs", "_id": "bar" },
];

export enum paymentMethods {
    CASH = 'CASH',
    CARD = 'CARD',
    GIFT_CARD = 'GIFT_CARD',
    NETBANKING = 'NETBANKING',
    QR = 'QR',
    PROVIDER = 'PROVIDER',
    HOUSE_ACCOUNT = 'HOUSE_ACCOUNT',
}

export const languages = [
    { code: 'en', name: 'English', translatedName: 'English', translatedCode: 'EN' },
    { code: 'es', name: 'Spanish', translatedName: 'Español', translatedCode: 'ES' },
    { code: 'zh', name: 'Chinese', translatedName: '中文', translatedCode: '中文' },
    { code: 'tl', name: 'Tagalog', translatedName: 'Tagalog', translatedCode: 'TL' },
    { code: 'vi', name: 'Vietnamese', translatedName: 'Tiếng Việt', translatedCode: 'VI' },
    { code: 'ar', name: 'Arabic', translatedName: 'العربية', translatedCode: 'ع' },
    { code: 'fr', name: 'French', translatedName: 'Français', translatedCode: 'FR' },
    { code: 'ko', name: 'Korean', translatedName: '한국어', translatedCode: 'KO' },
    { code: 'pt', name: 'Portuguese', translatedName: 'Português', translatedCode: 'PT' },
    { code: 'ru', name: 'Russian', translatedName: 'Русский', translatedCode: 'РУ' },
    { code: 'gu', name: 'Gujarati', translatedName: 'ગુજરાતી', translatedCode: 'GU' }
];

export enum PosBottomActions {
    REPRINT_RECEIPT = 'reprintReceipt',
    REPRINT_BAR_ORDER = 'reprintBarOrder',
    REPRINT_KITCHEN_ORDER = 'reprintKitchenOrder',
    RETURN = 'returnOrder',
    VOID = 'voidOrder',
    ADD_TIP = 'addTip',
    RETURN_TIP = 'returnTip',
    PRE_AUTH = 'preAuth',
    POST_AUTH = 'postAuth',
    CLOSE_BATCH = 'closeBatch',
    CANCEL = 'cancelOrder',
    TRANSFER = 'transferOrder',
    OPEN_CLOSE_REGISTER = 'openCloseCashRegister',
    CLOSE_OUT = 'closeOut',
}

export const actionButtons = [
    { title: 'Reprint Receipt', action: PosBottomActions.REPRINT_RECEIPT },
    { title: 'Reprint Bar Order', action: PosBottomActions.REPRINT_BAR_ORDER },
    { title: 'Reprint Kitchen Order', action: PosBottomActions.REPRINT_KITCHEN_ORDER },
    { title: 'Return', action: PosBottomActions.RETURN },
    { title: 'Void', action: PosBottomActions.VOID },
    { title: 'Add Tip', action: PosBottomActions.ADD_TIP },
    { title: 'Return Tip', action: PosBottomActions.RETURN_TIP },
    { title: 'Pre Auth', action: PosBottomActions.PRE_AUTH },
    { title: 'Post Auth', action: PosBottomActions.POST_AUTH },
    { title: 'Close Batch', action: PosBottomActions.CLOSE_BATCH },
    { title: 'Cancel Order', action: PosBottomActions.CANCEL, confirm: true, message: 'Are you sure you want to cancel this order?' },
    { title: 'Transfer Order', action: PosBottomActions.TRANSFER },
    { title: 'Open/Close Register', action: PosBottomActions.OPEN_CLOSE_REGISTER, confirm: true, message: 'Are you sure you want to Open/Close Register?' },
    { title: 'CloseOut', action: PosBottomActions.CLOSE_OUT, confirm: true, message: 'Are you sure you want to force close out?' },
]

export const customerType = [
    { value: "INDIVIDUAL", label: "Individual" },
    { value: "ORGANIZATION", label: "Organization" }
];

export const featuresList = [
    { label: "Restaurant", value: "restaurant" },
    { label: "Products", value: "products" },
    { label: "Staff", value: "staff" },
    { label: "Product Modifiers", value: "modifiers" },
    { label: "POS Device", value: "pos_device" },
];

// convert to enum 
export enum MasterPermissions {
    INVENTORY = "inventory",
    ORDERS = "orders",
    STAFFS = "Staffs",
    KITCHEN = "kitchen",
    REPORTS = "reports",
    TAXES = "taxes",
    VOID_RETUN_TIP = "voidRetunTip",
    CUSTOMER = "customer",
    CLOSEOUT_REPORT = "closeout_report",
    DISCOUNTS = "discounts",
    COUPONS = "coupons",
    SETTINGS = "settings",
    PAYMENTS = "payments",
    ALL_ORDERS = "all_orders",
    RESTAURANT_CLOSEOUT = "restaurant_closeout",
    RESERVATIONS = "reservations",
    MANAGE_ROLE = "manage_role",
    POS_DEVICE = "pos_device",
    OFFERS = "offers"
}

export const RoleMaster = [
    "Server",
    "Chef",
    "Cashier",
    "Tech",
    "Waiter",
    "Manager",
    "Cashier",
    "Bartender",
    "Owner/Admin"
]

export type FeatureCategory =
    | "tables"
    | "main_menu"
    | "order_features"
    // | "Payment Features"
    | "payment_types"
    | "payment_terminals"
    | "others";

export const initialFeatures: Record<FeatureCategory, string[]> = {
    "tables": ["table_plan", "table_reservations", "floor_plan"],
    "main_menu": ["table_plan", "to_go", "bar", "delivery"],
    "order_features": ["split", "separator", "tax_exemptions", "discount", "coupon", "remove_order"],
    // "Payment Features": ["House Account", "Payment Types", "Payment Terminals"],
    "payment_types": ["cash", "card", "pre_auth", "house_account", "qr_payments"],
    "payment_terminals": ["dejavoo", "pax", "pine_labs"],
    "others": ["open_close_cash_register", "admin", "kitchen_view"],
};

export const UNIT_OPTIONS = [
    // Weight
    { value: 'kg', label: 'kg (weight)' },
    { value: 'lb', label: 'lb (weight)' },
    { value: 'oz', label: 'oz (weight)' },
    { value: 'g', label: 'g (weight)' },

    // Volume
    { value: 'gal', label: 'gal (volume)' },
    { value: 'qt', label: 'qt (volume)' },
    { value: 'pt', label: 'pt (volume)' },
    { value: 'fl oz', label: 'fl oz (volume)' },
    { value: 'ml', label: 'ml (volume)' },
    { value: 'L', label: 'L (volume)' },
    { value: 'cup', label: 'cup (volume)' },
    { value: 'tbsp', label: 'tbsp (volume)' }, // tablespoon
    { value: 'tsp', label: 'tsp (volume)' },   // teaspoon

    // Count
    { value: 'each', label: 'each (count)' },
    { value: 'dozen', label: 'dozen (count)' },
    { value: 'case', label: 'case (count)' },
    { value: 'pack', label: 'pack (count)' },
    { value: 'tray', label: 'tray (count)' },
    { value: 'piece', label: 'piece (count)' },
    { value: 'clove', label: 'clove (count)' },
    { value: 'slice', label: 'slice (count)' },

    // Container
    { value: 'bag', label: 'bag (container)' },
    { value: 'box', label: 'box (container)' },
    { value: 'container', label: 'container (container)' },
    { value: 'jar', label: 'jar (container)' },
    { value: 'bottle', label: 'bottle (container)' },

    // Custom
    { value: 'portion', label: 'portion (custom)' },
    { value: 'serving', label: 'serving (custom)' },
];