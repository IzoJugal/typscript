import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button, Tabs, Tooltip } from "flowbite-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { apiUrl } from "../../../environment/env";
import { useLoading } from "../../../context/LoadingContext";
import apiClient from "../../../utils/AxiosInstance";
import { FormHeaderPaths } from "../../../utils/HeaderPaths";
import FormLoader from "../../../utils/common/FormLoader";
import LoyaltyProgram from "./LoyaltyProgram";
import { MdOutlineLoyalty, MdPayment } from "react-icons/md";
import { GrMoney } from "react-icons/gr";
import GratuityForm from "./GratuityForm";
import PaymentSettings from "./PaymentSettings";
import { TiDeviceDesktop } from "react-icons/ti";
import PosDeviceSettings, { posFormData } from "./PosDeviceSettings";
import { RiEdit2Fill } from "react-icons/ri";
import { createQueryParams } from "../../../utils/functions";


export const customTheme = {
    base: 'flex flex-col gap-2',
    tablist: {
        base: 'flex border-b border-DARK-300',
        tabitem: {
            base: "flex items-center justify-center rounded-t-lg p-4 text-sm font-medium first:ml-0 focus:outline-none focus:!ring-0 disabled:cursor-not-allowed disabled:text-DARK-400 disabled:dark:text-DARK-500",
            variant: {
                default: {
                    base: "rounded-t-lg",
                    active: {
                        on: "bg-DARK-100 bg-BRAND-100 dark:!bg-DARK-200 text-BRAND-600 dark:bg-DARK-800 dark:text-DARK-800",
                        off: "text-DARK-500 hover:bg-DARK-50 hover:text-DARK-600 dark:text-DARK-400 dark:hover:bg-DARK-800 dark:hover:text-DARK-300"
                    }
                },
            },
        },
    },
    tabpanel: '',
};

const RestaurantSettings = () => {
    const { isLoading, setIsLoading } = useLoading();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [restaurantData, setRestaurantData] = useState<any>({});
    const [loyaltyList, setLoyaltyList] = useState<any[]>([]);
    const [gratuities, setGratuities] = useState<any[]>([]);
    const [deviceList, setDeviceList] = useState<any[]>([]);
    const [posDeviceList, setPosDeviceList] = useState<posFormData[]>([]);
    const { restaurant } = useParams();
    const [_activeTab, setActiveTab] = useState<number>(0);
    const [numOfRecords, setNumOfRecords] = useState<number | any>(0);
    const [filterParams, setFilterParams] = useState<any>({
        page: Number(searchParams.get('page')) || 1,
        limit: Number(searchParams.get('limit')) || 10,
    });

    const tabTitles = ["Loyalty Settings", "Gratuity", "POS Devices", "Payment Types"];
    const openedTab = searchParams.get("activeTab") || tabTitles[0];

    // const hasSettingPermission = checkAccess(ModuleName.SETTINGS);
    // const hasSettingPermission = loginRole === SUPER_ADMIN;



    useEffect(() => {
        const index = tabTitles.findIndex((x: any) => x === openedTab);
        setActiveTab(index);
        checkTabForDefault(index);
        getRestaurant();
    }, [restaurant, setIsLoading, filterParams]);

    const getRestaurant = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get(`${apiUrl}/restaurant/${restaurant}`);
            const { success, restaurant: data } = response.data;
            if (success) {
                setRestaurantData(data);
                setGratuities(data.gratuity);
            }
        } catch (error) {
            console.error(error);
            toast.error("Network Error");
        } finally {
            setTimeout(() => setIsLoading(false), 500);
        }
    };

    const getLoyaltyData = async () => {
        try {
            setIsLoading(true);
            const combinedData = {
                ...{ restaurant },
                ...filterParams
            };
            const queryParams = createQueryParams(combinedData);
            const response = await apiClient.get(`${apiUrl}/loyalty-programs/${queryParams}`);
            const { success, loyaltyPrograms } = response.data;
            if (success) {
                setLoyaltyList(loyaltyPrograms);
            }
        } catch (error) {
            console.error(error);
            toast.error("Network Error");
        } finally {
            setTimeout(() => setIsLoading(false), 500);
        }
    };

    const getTerminals = async () => {
        try {
            setIsLoading(true);
            const combinedData = {
                ...filterParams
            };
            const queryParams = createQueryParams(combinedData);
            const response = await apiClient.get(`${apiUrl}/payment/device-list/${restaurant}/${queryParams}`);
            const { success, devices } = response.data;
            if (success) {
                setDeviceList(devices);
            }
        } catch (error) {
            console.error(error);
            toast.error("Network Error");
        } finally {
            setTimeout(() => setIsLoading(false), 500);
        }
    };

    const getPosDevices = async () => {
        try {
            setIsLoading(true);
            const combinedData = {
                ...{ restaurant },
                ...filterParams
            };
            const queryParams = createQueryParams(combinedData);
            const response = await apiClient.get(`${apiUrl}/device${queryParams}`);
            const { success, data: devices } = response.data;
            if (success) {
                setPosDeviceList(devices);
                const index = tabTitles.findIndex((x: any) => x === openedTab);
                if (index != 3) {
                    setNumOfRecords(response.data.count);
                }
            }
        } catch (error) {
            console.error(error);
            toast.error("Network Error");
        } finally {
            setTimeout(() => setIsLoading(false), 500);
        }
    };

    const handleLimit = (data: any) => {
        curPage(1);
        setFilterParams((prev: any) => ({ ...prev, limit: data }));
    }

    const curPage = (pageNum: any) => {
        setIsLoading(true);
        setFilterParams((prev: any) => {
            const updatedFormData = { ...prev, page: pageNum, activeTab: openedTab };
            updateURL(updatedFormData);
            return updatedFormData;
        });
    };

    const updateURL = (updatedFormData: any) => {
        const combinedData = { ...updatedFormData };
        const queryParams = createQueryParams(combinedData);
        setSearchParams(queryParams);
        navigate(`/restaurant/settings/${restaurant}/${queryParams}`);
    };

    const handleTabChange = (tabIndex: number) => {
        setNumOfRecords(0);
        setActiveTab(tabIndex);
        handleTabUrl(tabIndex);
        // checkTabForDefault(tabIndex);
        setFilterParams((prev: any) => {
            const updatedFormData = { ...prev, page: 1, limit: 10, activeTab: tabTitles[tabIndex] };
            updateURL(updatedFormData);
            return updatedFormData;
        });
    };

    const checkTabForDefault = async (tabIndex: number) => {
        switch (tabIndex) {
            case 0: // Loyalty Settings tab
                await getLoyaltyData();
                break;
            case 2: // POS Devices tab
                await getPosDevices();
                await getTerminals();
                break;
            case 3: // Payment terminal tab
                await getPosDevices();
                setNumOfRecords(0);
                await getTerminals();
                break;
            default:
                break;
        }
    }

    const handleTabUrl = (tabIndex: number) => {
        searchParams.set('activeTab', tabTitles[tabIndex]);
        setSearchParams(searchParams);
    };

    return (
        <div className="">
            <FormHeaderPaths
                page="Restaurant Settings"
                prevLink="/restaurant/1/"
                prevPage="Restaurant"
            />
            <div className="px-4 sm:px-6 lg:px-8 my-6">
            <div className="bg-white dark:bg-DARK-800 -shadow-lg rounded-2xl p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-2">
                    <div>
                        {restaurantData?.name && (<h2 className="text-2xl sm:text-2xl font-bold text-DARK-800 dark:text-DARK-100">
                            {restaurantData.name}
                        </h2>)}
                    </div>

                    {restaurantData?.name && (
                        <Tooltip content="Go to edit form">
                            <Button onClick={() => navigate(`/restaurant/edit/${restaurant}`)} className="px-4 bg-DARK-100 hover:!bg-DARK-200 text-DARK-800 dark:bg-DARK-700 dark:hover:!bg-DARK-600 dark:text-white text-sm font-medium rounded-md border border-DARK-200 dark:border-DARK-600 focus:!ring-0">
                                <RiEdit2Fill className="w-4 h-4 my-auto mx-1" />  Edit
                            </Button>
                        </Tooltip>
                    )}
                </div>
                {isLoading && <FormLoader count={1} />}
                {!isLoading && (
                    <div className="space-y-4">
                        <Tabs theme={customTheme} className="flex" onActiveTabChange={handleTabChange}>
                            <Tabs.Item active={openedTab === tabTitles[0]} title={tabTitles[0]} icon={MdOutlineLoyalty}>
                                <LoyaltyProgram {...{ restaurant, loyaltyList, setLoyaltyList, numOfRecords, handleLimit, filterParams, curPage, currency: restaurantData?.company?.currency?.symbol, currencyName: restaurantData?.company?.currency?.name, restaurantData }} />
                            </Tabs.Item>
                            <Tabs.Item active={openedTab === tabTitles[1]} title={tabTitles[1]} icon={GrMoney}>
                                <GratuityForm {...{ restaurant, gratuities }} />
                            </Tabs.Item>
                            <Tabs.Item active={openedTab === tabTitles[2]} title={tabTitles[2]} icon={TiDeviceDesktop}>
                                <PosDeviceSettings {...{ restaurant, posDeviceList, setPosDeviceList, numOfRecords, handleLimit, filterParams, curPage, deviceList, restaurantData }} />
                            </Tabs.Item>
                            <Tabs.Item active={openedTab === tabTitles[3]} title={tabTitles[3]} icon={MdPayment}>
                                <PaymentSettings {...{ restaurant, deviceList, setDeviceList, restaurantData, numOfRecords, handleLimit, filterParams, curPage, posDeviceList, }} />
                            </Tabs.Item>

                            {/* restaurant payment types and terminal provider tabs */}

                            {/* {hasSettingPermission && (
                                <Tabs.Item active={openedTab === tabTitles[4]} title={tabTitles[4]} icon={MdPayments}>
                                    <RestaurantTerminalProvider restaurantData={restaurantData} restaurantID={restaurant} />
                                </Tabs.Item>
                            )}
                            {hasSettingPermission && (
                                <Tabs.Item active={openedTab === tabTitles[5]} title={tabTitles[5]} icon={RiSecurePaymentFill}>
                                    <RestaurantPaymentTypes restaurantID={restaurant} restaurantData={restaurantData} />
                                </Tabs.Item>
                            )} */}
                        </Tabs>

                    </div>
                )}
            </div>
            </div>
        </div>
    );
};

export default RestaurantSettings;