import { Fragment, useEffect, useState } from "react";
import { Button, Dropdown, DropdownItem } from "flowbite-react";
import apiClient from "../../utils/AxiosInstance";
import { capitalized, playBeep } from "../../utils/utility";
import POSCart from "./POSCart";
import QuestionModal from "./QuestionModal";
import { LuCopyPlus } from "react-icons/lu";
import PosHeader from "./PosHeader";
import { fetchLocalProductsByCategory, getMachineID, getTotal, prepareLocalData, prepareOrderPayload, searchProducts } from "../../utils/common/PosTerminalUtility";
import { apiUrl, ProjectName } from "../../environment/env";
import PosSidebar from "./PosSidebar";
import { MANAGER_ROLES, orderTypeMap, SUPER_ADMIN } from "../../utils/common/constant";
import TableFloorPlan from "./TableFloorPlan";
import POSTerminalAuth from "./POSTerminalAuth";
import CustomerList from "./CustomerList";
import { FiX } from "react-icons/fi";
import { usePOS } from "../../context/POSProvider";
import { useAuth } from "../../context/AuthProvider";
import ConfirmModal from "../../hooks/ConfirmModal";
import { toast } from "react-toastify";
import { useSocket } from "../../context/SocketProvider";
import { RiCoinsLine } from "react-icons/ri";
import { useLanguage } from "../../context/LanguageContext";
import { useNavigate } from "react-router-dom";
import BottomPanel from "./BottomPanel";
import { IoMdClose } from "react-icons/io";

const POSMenu = () => {
    const navigate = useNavigate();
    const socket = useSocket();
    const {
        rawPayload,
        setRawPayload,
        cart, setCart, setTables,
        selectedRestaurant,
        setSelectedRestaurant,
        selectedCustomer,
        setSelectedCustomer,
        posLocalData,
        setPosLocalData,
        clearPOS,
        localApiData,
        setLocalApiData,
        searchMenu,
        setSearchMenu,
        posDeviceId,
        setPosDeviceId,
        currency,
        setCurrency
    } = usePOS();
    const { languageCode } = useLanguage();

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const { categories, subCategories, selectedSubCategory } = posLocalData;
    const [_products, setProducts] = useState<any[]>([]);
    const [displayItems, setDisplayItems] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [isCartOpen, setIsCartOpen] = useState<boolean>(true);
    const [openQuestion, setOpenQuestion] = useState<boolean>(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [selectedModifiers, setSelectedModifiers] = useState<any[]>([]);
    const [isFloorPlanOpen, setIsFloorPlanOpen] = useState<boolean>(false);
    const [tableRooms, setTableRooms] = useState<any>([]);
    const [customerList, setCustomerList] = useState<any>([]);
    const [isCustomerOpen, setIsCustomerOpen] = useState<boolean>(false);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [pendingRestaurant, setPendingRestaurant] = useState<any>(null);
    const [isSearch, setIsSearch] = useState<boolean>(false);
    const { userData } = useAuth();
    const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;

    useEffect(() => {
        if (!posDeviceId) {
            const deviceId = getMachineID();
            setPosDeviceId(deviceId);
        }

        if (loginRole === SUPER_ADMIN) {
            toast.warning("Super Admin can't access POS web terminal");
            navigate('/');
        }
    }, [loginRole, navigate]);

    if (loginRole === SUPER_ADMIN) return null;

    useEffect(() => {
        document.title = `${ProjectName} : Web Terminal`;
        setRawPayload((prev: any) => ({
            ...prev,
            orderType: prev.orderType || 'product',
            productOrderType: prev.productOrderType || 'quickService',
            restaurant: selectedRestaurant?._id,
            posDevice: posDeviceId,
        }));
        if (Object.keys(selectedRestaurant).length !== 0) {
            fetchLocalDataAPI();
            getPosDeviceDetails();
        }
    }, [selectedRestaurant, languageCode]);

    useEffect(() => {
        const handleResponse = (data: any) => {
            if (data.success) {
                setLocalApiData(data.categories);
            }
        };

        const deleteProduct = (data: any) => {
            const { orderData } = data;
            const cartItems = orderData?.cartItems || [];
            const updatedCart = orderData.orderType === 'table' ? cartItems[0]?.products || [] : cartItems;
            setCart(updatedCart);
            setRawPayload((prev: any) => ({
                ...prev,
                orderTotalAmount: orderData?.orderTotalAmount || 0,
            }));
        };
        const freeTables = (data: any) => {
            console.log("freeTables data", data);
        };
        const splitMainOrder = (data: any) => {
            console.log("splitMainOrder data", data);
        };

        socket.on("syncPosLocalApiData", handleResponse);
        socket.on("deleteProduct", deleteProduct);
        socket.on("freeTables", freeTables);
        socket.on("splitMainOrder", splitMainOrder);

        const intervalTime = 15 * 60 * 1000; // 15 Minutes
        /*** Emit(Sync local API) every 15 minutes  ***/
        const interval = setInterval(() => {
            socket.emit("syncPosLocalApiData", {
                company: userData?.staffMember?.company?._id,
                restaurant: selectedRestaurant._id,
                'time-zone': timeZone
            });
        }, intervalTime);

        // Cleanup to prevent duplicate listeners
        return () => {
            clearInterval(interval);
            socket.off("syncPosLocalApiData", handleResponse);
            socket.off("deleteProduct", deleteProduct);
            socket.off("freeTables", freeTables);
            socket.off("splitMainOrder", splitMainOrder);
        };
    }, [socket, userData?.staffMember?.company?._id, selectedRestaurant?._id]);

    useEffect(() => {
        setRawPayload((prev: any) => {
            const totals = getTotal({ ...prev, cartItems: cart });
            if (prev.orderType === 'table') {
                return {
                    ...prev,
                    ...totals,
                    cartItems: prev?.cartItems?.map((item: any, index: number) =>
                        index === 0 ? { ...item, products: cart } : item
                    ),
                };
            }

            return {
                ...prev,
                ...totals,
                cartItems: cart,
                orderType: prev.orderType !== 'table' ? 'product' : 'table',
                productOrderType: orderTypeMap?.[prev.orderType] || 'quickService',
                isBarItem: selectedCategory?.isBarItem,
                customer: selectedCustomer?._id
            };
        });
    }, [cart, selectedCustomer, rawPayload.isTaxExemption, languageCode]);

    const fetchLocalDataAPI = async () => {
        try {
            const { data } = await apiClient.get(`/product/local/allCategories?restaurant=${selectedRestaurant._id}`);
            if (data.success) {
                const { categories, currency } = data;
                setCurrency(currency);
                initialAPIDataToLocal(categories);
            } else {
                setProducts([]);
                setSelectedCategory(null);
                setDisplayItems([]);
                clearPOS();
            }
        } catch (error: any) {
            console.error("Failed to fetch initial data:", error.message);
        }
    };

    const getPosDeviceDetails = async () => {
        try {
            const response = await apiClient.get(`/device/app/${posDeviceId}`);
            const { success, data: posDevice } = response.data;
            if (success) {
                setPosLocalData((prev: any) => ({
                    ...prev,
                    posDeviceDetails: posDevice,
                    selectedPaymentProvider: {
                        provider: posDevice.defaultProvider,
                        terminal: posDevice.defaultTerminal
                    }
                }));
            }
        } catch (error: any) {
            console.error("Failed to fetch POS device details:", error.message);
        }
    };

    const initialAPIDataToLocal = (categories: any) => {
        const { categories: allCategories, products, subCategories, selectedCategory } = prepareLocalData(categories);
        filterProducts(products, allCategories[0]);
        setPosLocalData((prev: any) => ({
            ...prev,
            categories: allCategories,
            products,
            subCategories,
            selectedCategory
        }));
        setLocalApiData(categories);
    }

    const fetchProductsByCategory = async (category: any) => {
        try {
            const { products, subCategories, selectedSubCategory, categories: allCategories, isSubProducts }: any = fetchLocalProductsByCategory(category, categories);
            if (products.length > 0) {
                filterProducts(products, isSubProducts ? selectedSubCategory : category);
                setPosLocalData((prev: any) => ({
                    ...prev,
                    categories: allCategories,
                    products,
                    // subCategories: category?.parent ? posLocalData.subCategories : subCategories,
                    subCategories: category?.parent ? prev.subCategories : subCategories,
                    ...(category?.parent ? {} : { selectedCategory: category }),
                    selectedSubCategory
                }));
            }
        } catch (error: any) {
            console.error("Error fetching products by category:", error.message);
        }
    };

    const searchHandler = (search: string) => {
        setIsSearch(true);
        if (!search) {
            setSearchMenu('');
            setIsSearch(false);
            if (localApiData.length > 0) {
                initialAPIDataToLocal(localApiData);
            } else {
                if (Object.keys(selectedRestaurant).length !== 0) {
                    fetchLocalDataAPI();
                }
            }
            return;
        }
        setSearchMenu(search)
        const filteredProducts = searchProducts(search, categories);
        setDisplayItems(filteredProducts);
    }

    const filterProducts = (productList: any[], category: any) => {
        const filtered = productList.filter(item => item.category?._id === category._id);
        setDisplayItems(filtered);
    };

    // selectedModifiers
    const addToCart = (item: any) => {
        playBeep('addCart');
        /* setCart((prev: any) => {
            const productId = item._id;
            const modifiersSet = selectedModifiers[productId] || new Set();
            const modifiers = Array.from(modifiersSet);
            const isCartSeparatorIndex = typeof posLocalData.cartSeparatorIndex === 'number';

            const newItem = {
                product: item,
                modifiers,
                isSeparate: false,
                quantity: 1,
            };

            let updatedCart = [...prev];
            let updatedItem = { ...newItem };
            const separatorIndex = isCartSeparatorIndex && posLocalData.cartSeparatorIndex >= 0
                ? posLocalData.cartSeparatorIndex + 1
                : updatedCart.length;

            if (isCartSeparatorIndex && posLocalData.cartSeparatorIndex < updatedCart.length) {
                updatedCart = updatedCart.map((cartItem, idx) =>
                    idx === posLocalData.cartSeparatorIndex ? { ...cartItem, isSeparate: false } : cartItem
                );
                updatedItem = { ...newItem, isSeparate: true };
                setPosLocalData((prev: any) => ({
                    ...prev,
                    cartSeparatorIndex: (posLocalData.cartSeparatorIndex || 0) + 1,
                }));
            }

            return [
                ...updatedCart.slice(0, separatorIndex),
                updatedItem,
                ...updatedCart.slice(separatorIndex),
            ];
        }); */

        setCart((prev: any[]) => {
            const productId = item._id;
            const modifiersSet = selectedModifiers[productId] || new Set();
            const modifiers = Array.from(modifiersSet);

            let updatedCart = [...prev];
            let updatedItem = {
                product: item,
                modifiers,
                isSeparate: false,
                quantity: 1,
                position: 0,
            };

            const isCartSeparatorIndex = typeof posLocalData.cartSeparatorIndex === 'number';

            const insertIndex =
                isCartSeparatorIndex && posLocalData.cartSeparatorIndex >= 0
                    ? posLocalData.cartSeparatorIndex + 1
                    : updatedCart.length;

            if (isCartSeparatorIndex && posLocalData.cartSeparatorIndex < updatedCart.length) {
                updatedCart = updatedCart.map((cartItem, idx) =>
                    idx === posLocalData.cartSeparatorIndex
                        ? { ...cartItem, isSeparate: false }
                        : cartItem
                );

                updatedItem.isSeparate = true;

                setPosLocalData((prev: any) => ({
                    ...prev,
                    cartSeparatorIndex: insertIndex,
                }));
            }

            const intendedPosition =
                updatedCart[insertIndex - 1]?.position !== undefined
                    ? updatedCart[insertIndex - 1].position + 1
                    : 1;

            updatedItem.position = intendedPosition;

            updatedCart = updatedCart.map((cartItem, index) => {
                if (index >= insertIndex && cartItem.position >= intendedPosition) {
                    return {
                        ...cartItem,
                        position: cartItem.position + 1,
                    };
                }
                return cartItem;
            });

            updatedCart = [
                ...updatedCart.slice(0, insertIndex),
                updatedItem,
                ...updatedCart.slice(insertIndex),
            ];

            return updatedCart;
        });
    };

    const updateQuantity = async (curItem: any, delta: number, deltaIndex: number) => {
        setCart((prev: any) => {
            return prev
                .map((item: any, index: number) => {
                    // if (item.product._id === curItem.product._id) {
                    if (deltaIndex === index) {
                        if (curItem.isSeparate && item.quantity === 1) {
                            if (index > 0) {
                                prev[index - 1].isSeparate = true;
                            }
                        }
                        return { ...item, quantity: item.quantity + delta };
                    }

                    return item;
                })
                .filter((item: any) => item.quantity > 0);
        });

        const isAdd = delta < 0; /** when remove product then add ingredients else remove ingredients **/
        if (rawPayload?._id && delta > 0) {
            const response = await apiClient.post("/order/update-ingredient-stock", { product: curItem.product, isAdd });
            if (response.status === 200) {
                toast.success(response.data.message);
            }
        }
    };


    const closeModal = () => {
        setOpenQuestion(false);
        setSelectedProduct(null);
    }

    const sendOrder = async ({ updatedPayload, isPay, isPrintCheck }: any) => {
        try {
            const finalPayload = prepareOrderPayload({ ...updatedPayload, isPay, restaurant: updatedPayload?.restaurant || selectedRestaurant?._id, isPrintCheck });
            if (!finalPayload) {
                return;
            }
            const { data } = await apiClient.post("/order/newSave", finalPayload);
            if (data.success) {
                toast.success(data?.message);
                clearPOS();
                initialAPIDataToLocal(localApiData);
                setSelectedModifiers([]);
                setPosLocalData((prev: any) => ({ ...prev, isOpenPayment: false }));
                fetchLocalDataAPI();
            } else {
                toast.error(data?.message)
            }
        } catch (error: any) {
            console.error("Error fetching products by category:", error.message);
        }
    };

    const handleCustomers = () => {
        getCustomers();
        setIsCustomerOpen(true);
    }

    const getCustomers = async () => {
        try {
            const { data } = await apiClient.get(`/customer?restaurant=${selectedRestaurant?._id}`);
            if (data.status) {
                setCustomerList(data.data);
            }
        } catch (error: any) {
            console.error("Failed to fetch initial data:", error.message);
        }
    };

    const changeRestaurant = (restaurant: any) => {
        setPendingRestaurant(restaurant);
        clearPOS();
        setLocalApiData([]);
        setIsModalOpen(true);
    }

    const handleButtonAction = () => {
        if (pendingRestaurant) {
            setSelectedRestaurant(pendingRestaurant);
        }
        cleanOrder();
        setIsModalOpen(false);
    }

    const cleanOrder = () => {
        setSelectedCustomer(null);
        setCart([]);
        setTables([]);
    };

    useEffect(() => {
        /* const updateCustomer = (customerData: any) => {

            setCustomerList((prev: any) =>
                prev.map((item: any) => item._id === customerData._id ? customerData : item)
            );

            setSelectedCustomer((prev: any) =>
                prev && prev._id === customerData._id ? customerData : prev
            );
        }; */
        const updateHouseCredit = (houseCreditData: any) => {
            setCustomerList((prev: any) =>
                prev.map((item: any) =>
                    item._id === houseCreditData.customer
                        ? {
                            ...item,
                            houseAccount: {
                                currentBalance: houseCreditData.amount,
                                dueBalance: item.houseAccount?.dueBalance || 0 - houseCreditData.amount,
                            },
                        }
                        : item
                )
            );
        };
        const ingredientStockUpdated = (ingredientStockData: any) => {
            console.log('ingredientStockData', ingredientStockData);
        }

        socket.on('updateCustomerHouseCredit', updateHouseCredit);
        socket.on('ingredientStockUpdated', ingredientStockUpdated);
        return () => {
            socket.off("updateCustomerHouseCredit", updateHouseCredit)
            socket.off("ingredientStockUpdated", ingredientStockUpdated)
        }

    }, [socket, setSelectedCustomer]);

    return (
        <Fragment>
            <div className="grid grid-cols-10 min-h-screen max-h-screen -flex bg-DARK-50 dark:bg-DARK-950 text-DARK-900 dark:text-DARK-100 overflow-hidden gap-1">
                <div className="col-span-7 rounded shadow flex flex-col flex-1 overflow-hidden">
                    <PosHeader {...{ sendOrder, setIsFloorPlanOpen, setTableRooms, initialAPIDataToLocal, setSelectedModifiers }} />
                    <div className="flex flex-1 overflow-hidden">
                        <PosSidebar {...{ fetchProductsByCategory }} />
                        {/* <main className="flex-1 p-1 overflow-y-auto"> */}
                        <main className="flex flex-col flex-1 ps-1 pt-1 overflow-y-auto">
                            {/* Search  */}
                            <div className="flex flex-wrap justify-between items-start gap-2 p-4 bg-white dark:bg-DARK-900 rounded-lg shadow-sm mb-2">
                                <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[250px]">
                                    {/* <h1 className="text-3xl font-extrabold whitespace-nowrap">Menu</h1> */}

                                    {/* <input
                                        type="text"
                                        placeholder="Search menu..."
                                        value={searchMenu}
                                        onChange={(e) => searchHandler(e.target.value)}
                                        className="px-2 py-1 rounded-full border border-DARK-300 dark:border-DARK-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-DARK-800 dark:text-white w-full sm:w-auto"
                                    /> */}
                                    <div className="relative w-full sm:w-auto">
                                        <input
                                            type="text"
                                            placeholder="Search menu..."
                                            value={searchMenu}
                                            onChange={(e) => searchHandler(e.target.value)}
                                            className="px-2 py-1 pr-8 rounded-full border border-DARK-300 dark:border-DARK-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-DARK-800 dark:text-white w-full"
                                        />

                                        {searchMenu && (
                                            <button
                                                onClick={() => searchHandler("")}
                                                className="absolute text-lg right-2 top-1/2 transform -translate-y-1/2 text-red-500 hover:text-red-600"
                                            >
                                                <IoMdClose />
                                            </button>
                                        )}
                                    </div>
                                    <div className="text-DARK-600 dark:text-DARK-300 font-medium whitespace-nowrap">
                                        {MANAGER_ROLES.includes(userData?.staffMember?.role?.name) ? (
                                            <Dropdown
                                                renderTrigger={() => (
                                                    <span title="Change restaurant" className="cursor-pointer">
                                                        {capitalized(selectedRestaurant?.name)}
                                                    </span>
                                                )}
                                            >
                                                {userData.restaurant.map((rest: any) => (
                                                    <DropdownItem
                                                        key={rest._id}
                                                        onClick={() => changeRestaurant(rest)}
                                                        className={selectedRestaurant._id === rest._id ? "bg-BRAND-500 text-white" : ""}
                                                    >
                                                        {rest.name}
                                                    </DropdownItem>
                                                ))}
                                            </Dropdown>
                                        ) : (
                                            <span className="cursor-pointer">{capitalized(selectedRestaurant?.name)}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-end gap-4">
                                    {/* <div className="flex flex-col gap-1">
                                        <label htmlFor="tax-exempt-toggle" className="text-sm">Tax Exemption</label>
                                        <ToggleSwitch
                                            id="tax-exempt-toggle"
                                            checked={rawPayload.isTaxExemption || false}
                                            sizing="sm"
                                            onChange={() =>
                                                setRawPayload((prev: any) => ({ ...prev, isTaxExemption: !prev.isTaxExemption }))
                                            }
                                            className="transition-all focus-visible:ring-2 focus-visible:ring-primary-500"
                                        />
                                        {rawPayload.isTaxExemption && (
                                            <input
                                                id="tax-reason"
                                                type="text"
                                                placeholder="Reason for Tax Exemption"
                                                value={rawPayload.taxExemptionReason || ''}
                                                onChange={(e) =>
                                                    setRawPayload((prev: any) => ({ ...prev, taxExemptionReason: e.target.value }))
                                                }
                                                className="w-48 px-3 py-2 text-sm rounded-md border border-DARK-300 dark:border-DARK-600 bg-white dark:bg-DARK-800"
                                            />
                                        )}
                                    </div> */}

                                    <div className="flex flex-col">
                                        {selectedCustomer && selectedCustomer.pointsEarned > 0 && (
                                            <span className="flex justify-center">
                                                <RiCoinsLine className="w-5 h-5 my-auto" />
                                                {selectedCustomer?.pointsEarned?.toFixed(2)}
                                            </span>
                                        )}
                                        <div
                                            onClick={handleCustomers}
                                            className="relative inline-flex items-center px-6 py-2 rounded-full text-sm font-medium text-DARK-800 dark:text-DARK-300 hover:text-BRAND-600 dark:hover:text-BRAND-400 bg-DARK-100 dark:bg-DARK-700 hover:bg-DARK-200 dark:hover:bg-DARK-600 cursor-pointer group"
                                        >
                                            {selectedCustomer ? (
                                                <>
                                                    <div className="flex flex-col text-xs text-center">
                                                        <span>
                                                            {capitalized(selectedCustomer.firstName)} {capitalized(selectedCustomer.lastName || '')}
                                                        </span>
                                                        <span>{selectedCustomer.phoneNumber}</span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedCustomer(null);
                                                            setRawPayload((prev: any) => ({ ...prev, customer: null, isTaxExemption: false }));
                                                        }}
                                                        className="absolute -top-2 -right-2 hidden group-hover:flex items-center justify-center bg-white dark:bg-DARK-800 rounded-full p-1 border border-DARK-300 dark:border-DARK-600 text-DARK-500 dark:text-DARK-400 hover:text-red-600 dark:hover:text-red-500 shadow"
                                                    >
                                                        <FiX className="w-4 h-4" />
                                                    </button>
                                                </>
                                            ) : (
                                                "Guest"
                                            )}
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => setIsCartOpen(!isCartOpen)}
                                        className="px-4 py-2 rounded-md text-sm font-medium bg-DARK-100 dark:bg-DARK-700 hover:bg-DARK-200 dark:hover:bg-DARK-600 lg:hidden"
                                    >
                                        {isCartOpen ? "Hide Cart" : "Show Cart"}
                                    </Button>
                                </div>
                            </div>

                            <div className="2xl:max-h-[65vh] xl:max-h-[55vh] lg:max-h-[52vh] md:max-h-[40vh] sm:max-h-[30vh] overflow-y-scroll scrollbar-hide">
                                {!isSearch && subCategories?.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {subCategories.map((subCat: any) => (
                                            <Button
                                                key={subCat._id}
                                                onClick={() => {
                                                    fetchProductsByCategory(subCat);
                                                    setPosLocalData((prev: any) => ({ ...prev, selectedSubCategory: subCat }));
                                                }}
                                                className={`rounded-lg 
                                      px-1.5 text-xs sm:px-1 sm:text-sm 
                                      font-semibold transition shadow-md 
                                      ${selectedSubCategory?._id === subCat?._id
                                                        ? '!bg-BRAND-600 dark:hover:!bg-BRAND-700 border border-white'
                                                        : 'bg-BRAND-500 hover:!bg-BRAND-600 dark:bg-slate-700 dark:hover:!bg-BRAND-500'} 
                                      focus:!ring-0
                                    `}
                                            >
                                                {subCat.name}
                                            </Button>
                                        ))}
                                    </div>

                                )}

                                {displayItems.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                                        {displayItems.map((item) => (
                                            <div
                                                key={item._id}
                                                onClick={() =>
                                                    item?.questions?.length > 0
                                                        ? (setSelectedProduct(item), setOpenQuestion(true))
                                                        : addToCart(item)
                                                }
                                                className={`min-h-40 bg-white dark:bg-DARK-800 rounded-xl shadow hover:shadow-lg transition cursor-pointer flex flex-col overflow-hidden border 
                                                    ${item.stock === 0 ? 'border-WARNING/50 border-2 bg-WARNING/5 text-WARNING-700' :
                                                        item.stock <= 5 ? 'border-ORANGE-300 border bg-ORANGE-50 text-ORANGE-800' :
                                                            'dark:border-DARK-600 border-DARK-300'}
                                                  `}

                                            >
                                                <div className="h-28 flex items-center justify-center bg-gradient-to-tr from-DARK-100 to-DARK-200 dark:from-DARK-700 dark:to-DARK-600 relative overflow-hidden rounded-md">
                                                    {item.image ? (
                                                        <img
                                                            src={`${apiUrl}/${item.image}`}
                                                            alt={item.name}
                                                            loading="lazy"
                                                            className="h-full w-full object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.onerror = null;
                                                                e.currentTarget.src = "/images/default_food.png";
                                                            }}
                                                        />
                                                    ) : (
                                                        <img
                                                            src={`${apiUrl}/images/default_food.png`}
                                                            alt={item.name}
                                                            loading="lazy"
                                                            className="h-28 w-28 object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.onerror = null;
                                                                e.currentTarget.src = "/images/default_food.png";
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                                <div className="p-1 flex flex-col justify-between flex-1">
                                                    <div className="flex justify-between items-center">
                                                        <h3 className="text-base text-DARK-700 dark:text-DARK-300 truncate font-semibold">
                                                            {item?.nameMl?.[languageCode] ? capitalized(item?.nameMl?.[languageCode]) : capitalized(item.name)}
                                                        </h3>
                                                        {item?.questions?.length > 0 && (
                                                            <span title="Add Modifiers" className="text-BRAND-600 dark:text-BRAND-400">
                                                                <LuCopyPlus />
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs">Stock: {item.stock}</span>
                                                    <p className="text-sm text-DARK-600 dark:text-DARK-300">{currency?.symbol || "$"}{item.price.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center p-6 bg-white dark:bg-DARK-800 rounded-lg shadow-md w-full">
                                        <h2 className="text-xl font-semibold text-DARK-800 dark:text-white mb-4">
                                            {isSearch ? 'No results found for this search criteria.' : 'Currently, there are no items available at the selected restaurant.'}
                                        </h2>
                                        <p className="text-DARK-600 dark:text-DARK-300">

                                            {isSearch ? 'Please select a category or enter a search term to find items.' : 'It looks like there are no items available in this category right now.'}
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="mt-auto">
                                <BottomPanel />
                            </div>
                        </main>
                    </div>
                </div>

                <div className="col-span-3 rounded dark:bg-DARK-800 shadow-lg overflow-y-auto -hidden -lg:block">
                    <POSCart {...{ sendOrder, updateQuantity, isCartOpen, setIsCartOpen }} />
                </div>
                {/* {!isCartOpen ? null : (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                        onClick={() => setIsCartOpen(false)}
                    />
                )}
                <div className={`lg:hidden fixed right-0 top-0 bottom-0 w-80 bg-white dark:bg-DARK-800 shadow-lg transition-transform z-50 ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`} >
                    <POSCart {...{ sendOrder, updateQuantity, isCartOpen, setIsCartOpen }} />
                </div> */}
            </div>

            {/* Models */}
            {
                openQuestion && (
                    <QuestionModal
                        {...{
                            openQuestion,
                            closeQuestions: closeModal,
                            selectedProduct,
                            addToCart,
                            selectedModifiers,
                            setSelectedModifiers,
                        }}
                    />
                )
            }

            <TableFloorPlan {...{ isFloorPlanOpen, setIsFloorPlanOpen, tableRooms, setRawPayload }} />
            <POSTerminalAuth />
            <CustomerList {...{ isCustomerOpen, setIsCustomerOpen, customerList, selectedCustomer, setSelectedCustomer }} />
            <ConfirmModal
                isOpen={isModalOpen}
                message="Are you sure you want to change restaurant?"
                subText="Note: This will reset your order."
                onConfirm={handleButtonAction}
                onCancel={() => setIsModalOpen(false)}
            />
        </Fragment>
    );
};

export default POSMenu;
