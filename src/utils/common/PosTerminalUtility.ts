import { toast } from "react-toastify";
import apiClient from "../AxiosInstance";

export const prepareOrderPayload = (orderData: any) => {
    const {
        _id = null,
        orderType,
        productOrderType,
        orderNote,
        guestCount,
        customer,
        cartItems,
        gratuity,
        gratuityAmount,
        orderDiscountAmount,
        orderDiscountType,
        orderTotalAmount,
        totalTax,
        isPay,
        tenderAmount,
        change,
        couponAmount,
        couponId,
        deviceNumber,
        posDevice,
        orderName,
        restaurant,
        isSplitOrder = false,
        splitOrderId = null,
        splitCount,
        authCode,
        referenceCode,
        cardType,
        cardNumber,
        server,
        isTaxExemption,
        taxExemptionReason,
        terminalType,
        paymentMethod,
        isPrintCheck,
    } = orderData;

    let finalCart: any[] = [];
    if (orderType === 'table') {
        const allProducts = cartItems.flatMap((cart: any) => cart.products);
        const tableData = cartItems[0]?.table;

        if (!tableData) {
            toast.warning("Please select a table to continue.");
            return;
        }
        console.log("tableData", tableData);
        allProducts.forEach((product: any) => {
            product.serviceType = 'onTable';
        });

        const updatedCart = prepareProductCart(allProducts);

        finalCart.push({
            products: updatedCart,
            table: tableData,
        });
    } else {
        finalCart = prepareProductCart(cartItems);
    }

    const finalPayload = {
        _id,
        orderType,
        productOrderType,
        isPay,
        tenderAmount,
        change,
        orderNote,
        guestCount,
        customerId: customer ?? null,
        cartItems: finalCart,
        gratuity,
        gratuityAmount,
        orderDiscountAmount,
        orderDiscountType,
        orderTotalAmount,
        tax: totalTax,
        isSplitOrder,
        splitOrderId,
        splitCount,
        couponAmount,
        couponId,
        deviceNumber,
        posDevice,
        orderName,
        restaurant,
        authCode,
        referenceCode,
        cardType,
        cardNumber,
        server,
        isTaxExemption,
        taxExemptionReason,
        terminalType,
        paymentMethod,
        isPrintCheck,
    };

    console.log("finalPayload", finalPayload);
    return finalPayload;
};


const prepareProductCart = (cartItems: any) => {
    let updatedCart: any = [];
    cartItems.map((item: any) => {
        updatedCart.push({
            discountType: item?.discountType || 'percentage',
            discountAmount: item?.discountAmount || 0,
            modifiers: item?.modifiers.map((mod: any) => mod._id),
            note: item?.note,
            product: item?.product?._id,
            unitPrice: item?.unitPrice,
            quantity: item?.quantity,
            serviceType: item?.serviceType || "delivery",
            isSeparate: item?.isSeparate,
            isBarItem: item?.isBarItem,
            name: item?.product?.name,
            price: item?.product?.price,
            position: item?.position,
            status: item?.status,
            AlreadySend: false,
        })
    })
    return updatedCart;
};

export const getTotal = (rawPayload: any) => {
    const isCartValid = Array.isArray(rawPayload.cartItems) && rawPayload.cartItems.length > 0;
    if (!isCartValid) {
        return {
            cartItems: [],
            orderDiscountAmount: '0.00',
            totalTax: '0.00',
            gratuityAmount: '0.00',
            orderSubTotal: '0.00',
            orderTotalAmount: '0.00',
            couponAmount: '0.00',
        };
    }

    const { cartItems, isTaxExemption, gratuity, coupon } = rawPayload;

    const cartTotals = calculateCartTotals(cartItems, isTaxExemption);
    const orderSubTotal = Number(cartTotals.orderSubTotal) || 0;
    const orderDiscountAmount = Number(cartTotals.orderDiscountAmount) || 0;
    const totalTax = Number(cartTotals.totalTax) || 0;

    let couponAmount: number = Number(rawPayload?.couponAmount) || 0;

    if (coupon) {
        const discountValue = Number(coupon.discountValue ?? 0);
        if (coupon.discountType === 'percentage') {
            couponAmount = (discountValue / 100) * orderSubTotal;
        } else {
            couponAmount = discountValue;
        }

        couponAmount = Math.min(couponAmount, orderSubTotal);
    }

    const baseForGratuity = orderSubTotal - couponAmount;
    let gratuityAmount = 0;
    if (!isNaN(gratuity) && gratuity > 0) {
        gratuityAmount = (gratuity / 100) * baseForGratuity;
    }

    const orderTotalAmount = baseForGratuity + totalTax + gratuityAmount;

    return {
        cartItems: cartTotals.cartItems,
        orderDiscountAmount: orderDiscountAmount.toFixed(2),
        totalTax: totalTax.toFixed(2),
        gratuityAmount: gratuityAmount.toFixed(2),
        orderSubTotal: orderSubTotal.toFixed(2),
        orderTotalAmount: orderTotalAmount.toFixed(2),
        couponAmount: couponAmount.toFixed(2),
    };
};

export const calculateCartTotals = (cart: any[], isTaxExemption: boolean = false) => {
    let orderTotalAmount: number = 0;
    let orderDiscountAmount: number = 0;
    let totalTax: number = 0;
    let orderSubTotal: number = 0;

    const updatedCart = cart
        .map((cartItemObj: any) => {
            // const basePrice =  cartItemObj?.product?.price || 0;
              if (!cartItemObj?.unitPrice){
                cartItemObj.unitPrice = cartItemObj?.product?.price;
            }
            const quantity = cartItemObj?.quantity || 1;
            let totalPrice = cartItemObj?.product?.price * quantity;
            const modifiersTotal = (cartItemObj.modifiers || []).reduce((acc: number, modifier: any) => acc + (modifier.price * quantity), 0);

            totalPrice += modifiersTotal;
            orderSubTotal += totalPrice;
            cartItemObj.baseProductAmount = +totalPrice.toFixed(2);

            const cartDiscount = cartItemObj?.discountType?.toLowerCase() === "percentage"
                ? +(totalPrice * (parseFloat(cartItemObj?.discountAmount || 0)) / 100).toFixed(2)
                : +(parseFloat(cartItemObj?.discountAmount || 0)).toFixed(2);

            totalPrice -= cartDiscount;

            let itemTax = 0;
            if (cartItemObj?.product?.taxes?.length) {
                itemTax = calculateTotalWithTax(totalPrice, cartItemObj.product.taxes);
                totalTax += itemTax;
                if (!isTaxExemption) {
                    totalPrice += itemTax;
                }
            }

            cartItemObj.tax = +itemTax.toFixed(2);
            cartItemObj.totalPrice = +totalPrice.toFixed(2);

            orderTotalAmount += Number(totalPrice.toFixed(2));

            return cartItemObj;
        });

    return {
        cartItems: updatedCart,
        orderTotalAmount: Number(orderTotalAmount).toFixed(2),
        orderDiscountAmount: Number(orderDiscountAmount).toFixed(2),
        totalTax: Number(totalTax).toFixed(2),
        orderSubTotal: Number(orderSubTotal).toFixed(2),
    };
};

function calculateTotalWithTax(amount: number, taxes: { rate: number }[]): number {
    return parseFloat(taxes.reduce((totalTax: number, tax: { rate: number }) => totalTax + (amount * tax.rate / 100), 0).toFixed(2));
}

export const prepareMultiPayload = (rawPayload: any, splits: any, tables: any) => {
    const { cartItems: _, ...basePayload } = rawPayload;
    const isTableOrder = rawPayload.orderType === 'table';

    const mergedTableIds = tables.filter((table: any) => table?._id).map((table: any) => table._id);
    const rawTable = {
        table: tables[0]?._id,
        room: tables[0]?.room,
        mergedTables: mergedTableIds
    };

    const splitPayloads = splits.map((split: any) => {
        const { cartItems, orderDiscountAmount, orderSubTotal, orderTotalAmount, totalTax } = calculateCartTotals(split.products, rawPayload?.isTaxExemption);

        const cartPayload = isTableOrder
            ? [{ products: cartItems, table: rawTable }]
            : cartItems;

        return {
            ...basePayload,
              restaurant: rawPayload.restaurant,    
            cartItems: cartPayload,
            orderDiscountAmount,
            orderSubTotal,
            orderTotalAmount: parseFloat(orderTotalAmount) - ((split.couponAmount) ? Number(split.couponAmount) : 0),
            totalTax,
            _id: split?.splitOrderId || null,
            orderId: split?.splitOrderId || null
        };
    });
    const updatedSplit = splitPayloads.map((order: any, index: number) => {
        const payload = prepareOrderPayload(order);
        return {
            ...payload,
            couponAmount: 0,
            couponId: null,
            splitOrderId: rawPayload.isSplitOrder ? (rawPayload.orderId || rawPayload._id) : payload?._id || null,
            splitCount: payload?.splitCount || index + 1,
        };
    });


    return {
        mainOrder: prepareOrderPayload(rawPayload),
        splitOrders: updatedSplit
    };
};

export const sortMainCartBySplitCarts = (
    splitCarts: any[],
    cart: any[],
    setCart: Function
) => {
    /*  const orderedProductDetails = splitCarts.flatMap((split: any) =>
         split.products.map((p: any) => p.product._id)
     ); */
    const orderedProductDetails = splitCarts.flatMap((split: any) =>
        split.products.map((p: any) => ({
            productId: p.product._id,
            position: p.position,
            split: split._id,
        }))
    );

    const idOrderMap = new Map();
    orderedProductDetails.forEach((item: any) => {
        idOrderMap.set(item.position, item.productId);
    });
    /* orderedProductDetails.forEach((id: any, index: number) => {
        idOrderMap.set(id, index);
    }); */
    setCart(
        [...cart].sort((a: any, b: any) => {
            const indexA = idOrderMap.get(a.product._id) ?? Infinity;
            const indexB = idOrderMap.get(b.product._id) ?? Infinity;
            return indexA - indexB;
        }));
    /* setCart(
        [...cart].sort((a: any, b: any) => {
            const indexA = idOrderMap.get(a.product._id) ?? Infinity;
            const indexB = idOrderMap.get(b.product._id) ?? Infinity;
            return indexA - indexB;
        })
    ); */
};

export const getSplitOrders = async (
    orderId: string,
    cart: any[],
    setCart: Function,
    setSplitCarts: Function
) => {
    try {
        const { data } = await apiClient.get(`/order/get-split-orders/${orderId}`);
        if (data.success) {
            const isTableOrder = data.splitOrders[0].orderType === 'table';

            const splitCarts = data.splitOrders.map((order: any, index: number) => ({
                _id: `split-${index + 1}`,
                splitOrderId: order?._id || null,
                orderName: order?.orderName || null,
                products: isTableOrder
                    ? order.cart.flatMap((cartItem: any) => cartItem.products)
                    : order.cart.flatMap((cartItem: any) => cartItem),
            }));

            sortMainCartBySplitCarts(splitCarts, cart, setCart);
            setSplitCarts(splitCarts);
        }
    } catch (error: any) {
        console.error("Error fetching split orders:", error.message);
    }
};

export const getSingleOrder = async (orderId: string) => {
    try {
        const { data } = await apiClient.get(`/order/${orderId}`);
        if (data.success) {
            return { success: true, order: data.order };
        } else {
            return { success: false, message: data.message };
        }
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const recallOrder = async (
    orderId: string,
    {
        setPosLocalData,
        setRawPayload,
        setSelectedRestaurant,
        setSelectedCustomer,
        setCart,
        setTables,
    }: {
        setPosLocalData: Function;
        setRawPayload: Function;
        setSelectedRestaurant: Function;
        setSelectedCustomer: Function;
        setCart: Function;
        setTables: Function;
    }
) => {
    const result = await getSingleOrder(orderId);
    if (result.success && result.order) {
        const order = result.order;

        const paid = order?.multipleMethods?.length > 0
            ? order.multipleMethods.reduce((sum: number, x: any) => {
                const amount = Number(x.amount) || 0;
                return x.entryType === 'credit'
                    ? sum + amount
                    : x.entryType === 'debit'
                        ? sum - amount
                        : sum;
            }, 0)
            : 0;

        setPosLocalData((prev: any) => ({ ...prev, recalledOrder: order, selectedCoupon: order.couponId }));
        setRawPayload({
            ...order,
            restaurant: order.restaurant?._id,
            server: order.server?._id,
            couponId: order?.couponId?._id,
            coupon: order.couponId,
            couponCode: order?.couponId?.code,
            paidAmount: paid,
            isSplitOrder: order.isSplitOrder || !!order.splitOrderId,
            splitOrderId: order.splitOrderId || null,
            orderId: order.orderId || (order.splitOrderId ? order.splitOrderId : null),
        });
        setSelectedRestaurant(order.restaurant);
        setSelectedCustomer(order.customerId);

        if (order.orderType === 'table') {
            setCart(order.cartItems[0].products);
            setTables(order.cartItems[0].table.mergedTables);
        } else {
            setCart(order.cartItems);
        }

        return { success: true };
    } else {
        console.error("Order fetch failed:", result.message || result.error);
        return { success: false, error: result.message || result.error };
    }
};

export const prepareLocalData = (categories: any) => {
    if (!Array.isArray(categories) || categories.length === 0) {
        return {
            products: [],
            subCategories: [],
            selectedCategory: null,
            categories: [],
        };
    }

    const selectedCategory = categories[0];
    let products = selectedCategory.products || [];

    if (products.length === 0 && selectedCategory.subCategories?.length > 0) {
        products = selectedCategory.subCategories[0].products || [];
    }

    const subCategories = selectedCategory.subCategories || [];

    const filterProducts = (products: any[], category: any) => {
        const subCategoryIds = (category.subCategories || []).map((sub: any) => sub._id);

        return products.filter((product: any) => {
            const isDirectProduct = product.category?._id === category._id;
            const isSubCategoryProduct = subCategoryIds.includes(product.category?._id);
            return (isDirectProduct || isSubCategoryProduct) && product.isAvailable;
        });
    };

    const allProducts = [
        ...(selectedCategory.products || []),
        ...subCategories.flatMap((sub: any) => sub.products || []),
    ];

    const filteredProducts = filterProducts(allProducts, selectedCategory);

    return {
        products: filteredProducts,
        subCategories,
        selectedCategory,
        categories,
    };
};

export const fetchLocalProductsByCategory = (category: any, localCategories: any[]) => {
    try {
        if (!category?._id || !Array.isArray(localCategories)) {
            throw new Error("Invalid category or local data");
        }

        let targetCategory = localCategories.find((cat) => cat._id === category._id);


        if (!targetCategory) {
            for (const cat of localCategories) {
                if (cat.subCategories) {
                    targetCategory = cat.subCategories.find((sub: any) => sub._id === category._id);
                    if (targetCategory) break;
                }
            }
        }

        if (!targetCategory) {
            throw new Error("Category not found in local data");
        }

        let products = targetCategory.products || [];
        let subCategories = targetCategory.subCategories || [];
        let isSubProducts = false;
        let selectedSubCategory = null;

        if (targetCategory.parent) {
            selectedSubCategory = targetCategory;
        }

        if (products.length === 0 && subCategories.length > 0) {
            products = subCategories[0].products || [];
            isSubProducts = true;
        }

        if (isSubProducts && subCategories.length > 0) {
            selectedSubCategory = subCategories[0];
            targetCategory = selectedSubCategory;
        }

        const filterProducts = (products: any[], category: any) => {
            const subCategoryIds = (category.subCategories || []).map((sub: any) => sub._id);
            const seenProductIds = new Set<string>();
            const filtered: any[] = [];

            for (const product of products) {
                const isDirectProduct = product.category?._id === category._id;
                const isSubCategoryProduct = subCategoryIds.includes(product.category?._id);
                const isValid = (isDirectProduct || isSubCategoryProduct) && product.isAvailable;

                if (isValid && !seenProductIds.has(product._id)) {
                    filtered.push(product);
                    seenProductIds.add(product._id);
                }
            }

            return filtered;
        };

        const filteredProducts = filterProducts(
            [
                ...(targetCategory.products || []),
                ...subCategories.flatMap((sub: any) => sub.products || []),
            ],
            targetCategory
        );

        return {
            products: filteredProducts,
            subCategories: category?.parent ? [] : subCategories,
            selectedSubCategory,
            categories: localCategories,
            isSubProducts
        };
    } catch (error: any) {
        console.error("Error processing products by category:", error.message);
        return {
            products: [],
            subCategories: [],
            selectedSubCategory: null,
            categories: [],
        };
    }
};

export const searchProducts = (query: string, localCategories: any[]) => {
    try {
        if (!query || typeof query !== 'string' || !Array.isArray(localCategories)) {
            throw new Error("Invalid search query or local data");
        }

        const searchTerm = query.toLowerCase();
        const seenProductIds = new Set<string>();
        const matchedProducts: any[] = [];

        for (const category of localCategories) {
            const allProducts = [
                ...(category.products || []),
                ...(category.subCategories || []).flatMap((sub: any) => sub.products || [])
            ];

            for (const product of allProducts) {
                const nameMatch = String(product.name).toLowerCase().includes(searchTerm.toLowerCase());
                const isAvailable = product.isAvailable;

                if (nameMatch && isAvailable && !seenProductIds.has(product._id)) {
                    matchedProducts.push(product);
                    seenProductIds.add(product._id);
                }
            }
        }

        return matchedProducts;
    } catch (error: any) {
        console.error("Error searching products:", error.message);
        return [];
    }
};

export function getMachineID() {
    const screenInfo = `${window.screen.width}x${window.screen.height}`;
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const language = navigator.language;

    const uniqueID = `${userAgent}_${platform}_${language}_${screenInfo}`;
    let deviceID = hashString(uniqueID);

    return deviceID;
}
function hashString(str: any) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return hash.toString(36);
}