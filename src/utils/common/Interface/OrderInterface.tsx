export interface IOrder {
    _id: string;
    orderName: string;
    customerId: IUser;
    server: Istaff;
    company: IBusiness;
    restaurant?: {
        name?: string;
    };
    orderTotalAmount: number;
    status: string;
    tip: number;
    orderType: string;
    productOrderType: string;
    orderDate: string;
    orderId: string;
    cartItems: (ITableCartItem | IcartItem)[];
    tax: number;
    couponId: ICoupon;
    couponAmount: number;
    paymentMethod: IPaymentMethod;
    paymentType: string;
    change: number;
    gratuity: number;
    gratuityAmount: number;
    multipleMethods: IPaymentMethod[];
    amount: number;
    method: string;
    roomName: string | null;
    isSplitOrder: boolean;
    splitOrderId: string | null;
    splitCount: number | null;
    canceledType: string | null;
    isRemoved?: boolean;
}

export interface ITableCartItem {
    table: ITable;
    order: string;
    products: IProduct[];
}

export interface ITable {
    table: ITable;
    room: Iroom;
    mergedTables: ITable[];
}

export interface Iroom {
    _id: string;
    name: string;
    size: number;
    amenities: string[];
}

export interface IcartItem {
    discountAmount: number;
    discountType: string;
    note: string;
    quantity: number;
    serviceType: string;
    modifiers: IModifier[];
    product: IProduct;
    order: string;
    isComped: boolean;
    compReason: string;
    compAmount: number;
}


export interface IModifier {
    _id: string;
    name: string;
    description: string;
    price: number;
    isAvailable: boolean;
    isVeg: boolean;
    category: string;
}


export interface IUser {
    _id?: string;
    firstName: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    postalCode?: string;
    address?: string;
    city?: string;
    country?: string;
    billingAddress?: IBillingAddress;
}

export interface IProduct {
    name: string;
    description: string;
    price: number;
    unit: string;
    applicableTax: string;
    sellingPriceTaxType: string;
    type: string;
    sku: string | null;
    stock: number;
    modifiers: IModifier[];
    questions: IQuestion[];
    taxes: [];
    usedCatTax: boolean;
    category: IProductCategory;
    isAvailable: boolean;
    isDelete: boolean;
    background: string,
    fontType: string,
    fontSize: string,
    fontColor: string,
    itemColor: string,
    company: IBusiness;
    restaurant: Irestaurant;
    quickBookId: string,
    createdAt: Date;
    updatedAt: Date;
}

export interface IProductCategory {
    name: string;
    description?: string;
    listingOrder: number | null
    isActive: boolean;
    isBarItem: boolean;
    parent: IProductCategory | null;
    background: string,
    isMeal: Boolean,
    mealPeriod: IMealPeriod,
    fontType: string,
    fontSize: string,
    fontColor: string,
    itemColor: string,
    company: IBusiness;
    restaurant: Irestaurant;
    taxes: [],
    quickBookId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IMealPeriod {
    name: string;
    startTime: string;
    endTime: string;
    isActive: boolean;
    isDelete: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    time: {
        timeStartTime: string,
        timeEndTime: string
    },
    day: {
        specialDayName: string,
        specialDayDate: string
    },
    week: {
        weekMonth: string,
        weekStartDate: string,
        weekEndDate: string
    }
    month: string
    restaurant?: Irestaurant;
    company?: IBusiness;
}

export interface IQuestion extends Document {
    question: string;
    question_level: number;
    noOfChoice: number;
    isActive: boolean;
    enforceAnswer: boolean;
    answers: [];
    company: IBusiness;
    restaurant: Irestaurant;
    createdAt: Date;
    updatedAt: Date;
}

export interface IBillingAddress {
    address1?: string;
    address2?: string;
    city?: string;
    postalCode?: string;
    state?: string;
    country?: string;
}


export interface ICoupon {
    _id: string;
    code: string;
    discountType: string;
    discountValue: number;
    minOrderAmount?: number;
    maxDiscountAmount?: number;
    usageLimit: number;
    expirationDate: Date;
    company: IBusiness;
    restaurant: Irestaurant;
    isActive: boolean;
    timesUsed: number;
}

export interface IPayment {
    _id: string;
    amount: number;
    multipleMethods: IPaymentMethod[];
}

export interface IPaymentMethod {
    method: string;
    amount: number;
    cardNumber?: string | null;
    cardType?: string | null;
    referenceCode?: string | null;
    authCode?: string | null;
    giftCardCode?: string | null;
    giftCardBalance?: number;
    giftCardExpiry?: string | null;
    isReturn?: boolean;
    isVoid?: boolean;
    _id?: string;
}

export interface Istaff {
    _id: string;
    name: string;
    email: string;
    phoneNumber: string;
    role: IRole;
}

export interface IRole {
    _id: string;
    name: string;
}

export interface IBusiness {
    _id?: string;
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    registrationNumber?: string;
    taxID?: string;
    owner?: string;
    createdAt?: Date;
    isActive?: boolean;
    isDelete?: boolean;
    timeOut?: number;
    text?: string;
    currency?: {
        symbol?: string;
        code?: string;
        label?: string;
    }
}

export interface Irestaurant {
    _id: string;
    name: string;
    address: IAddress;
    company: IBusiness;
    phoneNumber?: string;
    email: string;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    createdBy: IUser;
    openTime?: string;
    closeTime?: string;
    autoCloseOutTime?: string;
    timeZone?: string | null;
    gratuity?: string[];
    currency?: string;
    paymentCredentials?: {
        upiId?: string,
    },
    countryCode?: string;
    fssNo?: string
}

export interface IPackage {
    _id: string;
    name: string;
    price: number;
    facilities: string[];
    duration: number;
    maxGuests: number;
}

export interface IAddress {
    street: string;
    city: string;
    state?: string;
    zipCode?: string;
    country?: string;
}