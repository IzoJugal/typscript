export const productOrderPayload = (orderData: any, isPay: boolean) => {
    console.log("cartData", orderData);
    const {
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
        tax,
        couponAmount,
        couponId,
        deviceNumber,
        posDevice,
        orderName,
        restaurant,
    } = orderData;


    let finalCart: any[] = [];

    if (orderType === 'table') {
        const allProducts = cartItems.flatMap((cart: any) => cart.products);
        const tableData = cartItems[0]?.table;
        allProducts.filter((x: any) => x.serviceType = 'onTable');
        const updatedCart = prepareProductCart(allProducts);

        finalCart.push({
            products: updatedCart,
            table: tableData,
        });
    } else {
        finalCart = prepareProductCart(cartItems);
    }

    const finalPayload = {
        orderType,
        productOrderType,
        orderId: orderData?._id ?? null,
        isPay,
        orderNote,
        guestCount,
        customerId: customer ?? null,
        cartItems: finalCart,
        gratuity,
        gratuityAmount,
        orderDiscountAmount,
        orderDiscountType,
        orderTotalAmount,
        tax,
        splitOrderId: null,
        couponAmount,
        couponId,
        deviceNumber,
        posDevice,
        orderName,
        restaurant,
    };
    // console.log("finalPayload", finalPayload);
    return finalPayload;
};

const prepareProductCart = (cartItems: any) => {
    let updatedCart: any = [];
    cartItems.map((item: any, index: number) => {
        updatedCart.push({
            discountType: item?.discountType || 'percentage',
            discountAmount: item?.discountAmount || 0,
            modifiers: item?.modifiers.map((mod: any) => mod._id),
            note: item?.note,
            product: item?.product?._id,
            quantity: item?.quantity,
            serviceType: item?.serviceType || "delivery",
            isSeparate: item?.isSeparate,
            isBarItem: item?.isBarItem,
            name: item?.product?.name,
            price: item?.product?.price,
            position: index + 1,
            status: item?.status,
            AlreadySend: false,
        })
    })
    return updatedCart;
};


export const getTotal = (rawPayload: any) => {
    
    if (!Array.isArray(rawPayload.cartItems) || rawPayload.cartItems.length === 0) {
        return rawPayload;
    }
    let orderDiscountAmount: number, totalTax: number, orderTotalAmount: number, gratuityAmount: number = 0;

    const cartTotals = calculateCartTotals(rawPayload.cartItems);
    const subtotal = Number(cartTotals.orderTotalAmount);

    orderDiscountAmount = Number(cartTotals.orderDiscountAmount);
    totalTax = Number(cartTotals.totalTax);
    orderTotalAmount = Number(subtotal);

    if (rawPayload.gratuity && !isNaN(rawPayload.gratuity)) {
        const gratuityRate = rawPayload.gratuity / 100;
        gratuityAmount = subtotal * gratuityRate;
        orderTotalAmount += gratuityAmount;
    }

    return {
        cartItems: cartTotals.cartItems,
        orderDiscountAmount: orderDiscountAmount.toFixed(2),
        totalTax: totalTax.toFixed(2),
        gratuityAmount: gratuityAmount.toFixed(2),
        orderSubTotal: Number(cartTotals.orderSubTotal).toFixed(2),
        orderTotalAmount: orderTotalAmount.toFixed(2),
    };
};

export const calculateCartTotals = (cart: any[]) => {
    let orderTotalAmount: number = 0;
    let orderDiscountAmount: number = 0;
    let totalTax: number = 0;
    let orderSubTotal: number = 0;

    const updatedCart = cart
        .map((cartItemObj: any) => {
            const basePrice = cartItemObj?.product?.price || 0;
            const quantity = cartItemObj?.quantity || 1;
            let totalPrice = basePrice * quantity;
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
                totalPrice += itemTax;
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
    return taxes.reduce((totalTax: number, tax: { rate: number }) => totalTax + (amount * tax.rate / 100), 0);
}