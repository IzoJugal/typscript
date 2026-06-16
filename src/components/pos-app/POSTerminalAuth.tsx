import { Modal } from "flowbite-react";
import { Fragment, useEffect } from "react";
import { capitalized } from "../../utils/utility";
import { FaMapMarkerAlt } from "react-icons/fa";
import { useAuth } from "../../context/AuthProvider";
import { usePOS } from "../../context/POSProvider";

const POSTerminalAuth = () => {
    const { userData } = useAuth();
    // const loginRole = userData?.staffMember?.role?.name;
    const { setSelectedRestaurant, setRawPayload, selectedRestaurant } = usePOS();

    useEffect(() => {
        if (userData?.restaurant?.length === 0) {
            setSelectedRestaurant(userData?.staffMember?.restaurant);
            setRawPayload((prev: any) => ({ ...prev, restaurant: userData?.staffMember?.restaurant?._id }));
        }
    }, [userData]);

    return (
        <Fragment>
            <Modal
                show={userData?.restaurant?.length !== 0 && !selectedRestaurant?._id}
                onClose={selectedRestaurant?._id}
                size="5xl"
                className="backdrop-blur-sm bg-DARK-500/30 dark:bg-DARK-950/50"
            >
                {/* <Modal.Header className="bg-white dark:bg-DARK-800 text-center"> */}

                {/* </Modal.Header> */}
                <Modal.Body className="bg-slate-50 dark:bg-DARK-700 rounded-b-xl px-6 py-8 rounded-xl">
                    <div className="w-full text-xl font-semibold text-gray-800 dark:text-white mb-3">
                        Select a Restaurant
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {userData.restaurant.map((restaurant: any, index: number) => (
                            <button
                                key={index}
                                className="flex flex-col items-start bg-white dark:bg-DARK-600 rounded-lg p-5 shadow-sm hover:shadow-md transition duration-200 border border-transparent hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onClick={() => { setSelectedRestaurant(restaurant); setRawPayload((prev: any) => ({ ...prev, restaurant: restaurant?._id })) }}
                            >
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {restaurant?.name}
                                </h3>

                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 flex items-center gap-1">
                                    {restaurant?.address?.city && restaurant?.address?.zipCode ? (
                                        <>
                                            <FaMapMarkerAlt className="text-red-500" />
                                            {[
                                                restaurant.address.city,
                                                restaurant.address.state,
                                                restaurant.address.country,
                                                restaurant.address.zipCode,
                                            ]
                                                .filter(Boolean)
                                                .map(capitalized)
                                                .join(", ")}
                                        </>
                                    ) : (
                                        "Location not available"
                                    )}
                                </p>


                            </button>
                        ))}
                    </div>
                </Modal.Body>
            </Modal>
        </Fragment>
    );
};

export default POSTerminalAuth;
