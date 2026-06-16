import { Button, Label, Modal, Table } from "flowbite-react";
import { useCallback, useEffect, useState } from "react";
import { HiPencil } from "react-icons/hi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { toast } from "react-toastify";
import { useLoading } from "../../context/LoadingContext";
import ConfirmModal from "../../hooks/ConfirmModal";
import apiClient from "../../utils/AxiosInstance";
import { DetailHeaderPaths } from "../../utils/HeaderPaths";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Pagination from "../Pagination/Pagination";
import PageSize from "../Pagination/PageSize";
import TableHeaders from "../../utils/common/TableHeaders";
import AddButton from "../../utils/common/AddButton";
import NoData from "../../utils/common/NoData";
import { deleteBtnStyle, editBtnStyle, } from "../../utils/common/constant";
import { createQueryParams } from "../../utils/functions";
import { useSocket } from "../../context/SocketProvider";
import { capitalized } from "../../utils/utility";
import { AiOutlineLoading } from "react-icons/ai";
import ListLoader from "../../utils/common/ListLoader";
import { MdClear } from "react-icons/md";


interface ISecurity {
    _id?: string; // Optional for new entries
    name: string;
}

interface ErrorState {
    name?: string;
}

const Security = () => {
    const [securities, setSecurities] = useState<ISecurity[]>([]);
    const { isButtonLoading, setIsButtonLoading } = useLoading();
    const [isLoading, setIsLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [errors, setErrors] = useState<ErrorState>({});
    const [formData, setFormData] = useState<ISecurity>({
        _id: '',
        name: "",
    });
    const { pages }: any = useParams<{ id: string }>();
    const [page, setPage] = useState<number>(+pages);
    const [numOfRecords, setNumOfRecords] = useState<number | any>(0);
    const [limit, setLimit] = useState(10);
    const location = useLocation();
    const navigate = useNavigate();
    // const { userData } = useAuth();
    // const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
    // const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const [searchParams, setSearchParams] = useSearchParams();
    const [searchFilter, setSearchFilter] = useState<any>({
        name: searchParams.get('name') || '',
    });

    const [queryData, setQueryData] = useState({
        page: parseInt(searchParams.get("page") || "1", 10),
        limit: parseInt(searchParams.get("limit") || "10", 10),
        source: "web",
    });

    const columnNames = ["Sr.No.", "Name", "Actions"];

    const getSecurities = useCallback(async () => {
        try {
            setIsLoading(true);
            const combinedData = {
                ...queryData,
                ...searchFilter
            };
            const queryParams = createQueryParams(combinedData);
            const response = await apiClient.get(`/security${queryParams}`,);
            setTimeout(() => {
                setSecurities(response.data.data);
                setNumOfRecords(response.data.count)
                setIsLoading(false);
            }, 500);
        } catch (error) {
            setIsLoading(false);
            console.error(" ~ getSecurities error :- ", error);
            toast.error("Failed to load security entries.");
        }
    }, [setIsLoading, limit, page, searchFilter]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
        if (errors[name as keyof ErrorState]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    const isValid = (): boolean => {
        let isValid = true;
        const errorMessage: Partial<ErrorState> = {};

        if (!formData.name) {
            errorMessage.name = "Please enter a name.";
            isValid = false;
        }

        setErrors(prev => ({ ...prev, ...errorMessage }));
        return isValid;
    };

    const addEditSecurity = () => {
        setIsOpenModal(true);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (isValid()) {
            try {
                setIsButtonLoading(true);
                let response: any;
                if (formData._id) {
                    response = await apiClient.patch(`/security/${formData._id}`, formData);
                    if (response?.data?.success) {
                        toast.success(response?.data?.message || 'Security entry updated successfully.');
                        setIsLoading(true);
                        setSecurities(prevSecurities =>
                            prevSecurities.map(security => (security._id === formData._id ? response.data.data : security))
                        );
                    }
                } else {
                    response = await apiClient.post('/security/add', formData);
                    if (response?.data?.success) {
                        toast.success(response?.data?.message || 'Security entry added successfully.');
                        setIsLoading(true);
                        // const newData = response.data.data
                        // setSecurities((prevData: any) => {
                        //     const updatedData = [...prevData];
                        //     if (prevData?.length >= limit) {
                        //         updatedData?.pop();
                        //     }
                        //     return [newData, ...updatedData];
                        // });
                        // setNumOfRecords((prev: any) => prev + 1);
                    }
                }
                setIsButtonLoading(false);
                if (response?.data?.success) {
                    setIsOpenModal(false);
                    setTimeout(() => {
                        setIsLoading(false);
                        setFormData({ _id: '', name: "" });
                    }, 500);
                } else {
                    setIsLoading(false);
                    toast.error(response?.data?.message || 'There was an issue with the request.')
                }
            } catch (error: any) {
                setIsButtonLoading(false);
                console.log('Error during form submission:', error);
                toast.error(error?.response?.data?.message || 'There was an issue with the request.');
                setIsLoading(false);
            }
        }
    };

    const handleEdit = (item: ISecurity) => {
        setFormData(item);
        setIsOpenModal(true);
    };

    const handleDelete = async () => {
        if (!selectedId) return;
        setIsDeleteOpen(false);
        setSelectedId(null);
        try {
            setIsLoading(true);
            const response = await apiClient.post(`/security/${selectedId}`, {});
            const updatedSecurities = securities.filter(item => item._id !== selectedId);
            setSecurities(updatedSecurities);
            if (response?.data?.success) {
                toast.success(response.data.message);
            } else {
                setIsLoading(false);
                toast.error(response?.data?.message);
            }
            getSecurities();
            if (updatedSecurities.length === 0) {
                // curPage(page - 1)
                if (page > 1) {
                    curPage(page - 1);
                } else {
                    curPage(1);
                }
            }
            setTimeout(() => {
            setIsLoading(false)
            setNumOfRecords(numOfRecords - 1)
            }, 500);
        } catch (error) {
            console.log('Delete security error:', error);
            toast.error('Failed to delete the security entry. Please try again.');
            setIsLoading(false);
        }
    };

    const confirmDelete = (id: string) => {
        setSelectedId(id);
        setIsDeleteOpen(true);
    };

    const onCloseModal = () => {
        setIsOpenModal(false);
        setIsButtonLoading(false)
        setFormData({ _id: '', name: "" });
        setErrors({});
    };


    useEffect(() => {
        // const myParam: any = new URLSearchParams(location.search).get("page");
        // if (myParam) {
        //     setPage(myParam - 1);
        // }
        const debounceDelay = setTimeout(() => {
            getSecurities();
        }, 500);
        return () => clearTimeout(debounceDelay);
    }, [page, limit, getSecurities, location.search]);


    const handleLimit = (data: any) => {
        curPage(1)
        setLimit(data);
        setQueryData((prev) => ({ ...prev, limit: data }))
    }

    const updateURL = (updatedFormData: any) => {
        const combinedData = { ...updatedFormData, ...searchFilter };
        const queryParams = createQueryParams(combinedData);

        setSearchParams(queryParams);
        navigate(`/security/${updatedFormData.page}/${queryParams}`);
    };

    const curPage = (pageNum: any) => {
        if (pageNum !== page) {
            setIsLoading(true)
            setQueryData((prev) => {
                const updatedFormData = { ...prev, page: pageNum };
                updateURL(updatedFormData);
                return updatedFormData;
            });
        }
        setPage(pageNum);
    };

    useEffect(() => {
        if (Object.values(searchFilter).some((value) => value !== "") ||
            Object.values(searchFilter).every((value) => value === "")) {

            if (queryData?.page !== 1) {
                setQueryData((prev) => ({ ...prev, page: 1 }));
                setPage(1);
            }
        }
    }, [searchFilter]);


    useEffect(() => {
        const pageFromURL = parseInt(searchParams.get("page") || "1", 10);
        const limitFromURL = parseInt(searchParams.get("limit") || "10", 10);

        setQueryData((prev) => ({
            ...prev,
            page: pageFromURL,
            limit: limitFromURL,
        }));

        setPage(pageFromURL);
        setLimit(limitFromURL);
    }, []);

    const navigateSearchPrams = useCallback(() => {
        setIsLoading(true);
        updateURL(queryData);
        setLimit(queryData?.limit)
        setPage(queryData?.page);
    }, [searchFilter, queryData,]);

    useEffect(() => {
        navigateSearchPrams();
    }, [searchFilter, navigateSearchPrams]);

    // const handleFilter = (value: string) => {
    //     setSearchFilter((prev: any) => ({ ...prev, company: value }))
    // }

    const handleClear = () => {
        const hasValidFilter = Object.values(searchFilter).some(value => value !== '');
        if (hasValidFilter) {
            setSearchFilter({});
        }
    }


    const socket = useSocket()


    useEffect(() => {
        const addSecurity = (data: any) => {

            setSecurities((prevData: any) => {
                const updatedData = [...prevData];
                if (prevData?.length >= limit) {
                    updatedData?.pop();
                }
                return [data, ...updatedData];
            });
            setNumOfRecords((prev: any) => prev + 1);

        };

        const updateSecurity = (data: any) => {
            setSecurities((prev: any) => prev.map((item: any) => item._id === data._id ? data : item));
        };
        const deleteSecurity = (data: any) => {
            // setSecurities((prev: any) => prev.filter((item: any) => item._id !== data._id));
            const exists = securities?.some((item: any) => {
                return String(item._id) === String(data._id)
            });
            if (!exists) {
                setIsLoading(false)
                return
            };
            const updatedSecurities = securities.filter(item => item._id !== data?._id);
            setSecurities(updatedSecurities);
            getSecurities();
            if (updatedSecurities.length === 0) {
                // curPage(page - 1)
                if (page > 1) {
                    curPage(page - 1);
                } else {
                    curPage(1);
                }
            }
        };

        socket.on("addSecurity", addSecurity);
        socket.on("updateSecurity", updateSecurity);
        socket.on("deleteSecurity", deleteSecurity);

        return () => {
            socket.off("addSecurity", addSecurity);
            socket.off("updateSecurity", updateSecurity);
            socket.off("deleteSecurity", deleteSecurity);
        };
    }, [socket, securities]);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6">
            <div className="container mx-auto flex">
                <DetailHeaderPaths label="Security" />
            </div>
            <div className="container mx-auto  flex flex-col xs:flex-row justify-between">
                {/* <Filters searchFilter={searchFilter} loginRole={loginRole} setSearchFilter={setSearchFilter} module="security" setIsDropdownOpen={setIsDropdownOpen} isDropdownOpen={isDropdownOpen} handleFilter={handleFilter} /> */}
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchFilter?.name ?? ''}
                        onChange={e => setSearchFilter((prev: any) => ({ ...prev, name: e.target.value }))}
                        className="rounded-md focus:!ring-0 min-w-60 w-full px-3 py-2 dark:bg-DARK-700 dark:text-DARK-100 dark:placeholder:text-DARK-400 dark:border-none border border-DARK-300"
                    />
                    <button
                        onClick={handleClear}
                        className="inline-flex h-10 items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 focus:outline-none focus:!ring-0 focus:ring-red-500 rounded-lg transition-colors duration-200"
                    >
                        <MdClear className="w-4 h-4 font-bold" />
                        Clear
                    </button>
                </div>
                <div className="group relative">
                    <span onClick={() => addEditSecurity()}>
                        <AddButton msg="Add a new security" />
                    </span>
                </div>
            </div>
            <div className="bg-white dark:bg-DARK-800 rounded-xl shadow-sm overflow-x-auto border-t-2 border-BRAND-300 dark:border-DARK-400">
                <Table hoverable>
                    <TableHeaders columnNames={columnNames} />
                    <Table.Body className="divide-y">
                        {isLoading && <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                            <Table.Cell colSpan={8} className="text-center py-6">
                                <ListLoader />
                            </Table.Cell>
                        </Table.Row>}
                        {!isLoading && securities.length > 0 ? securities.map((item: any, index: number) => (
                            <Table.Row key={item._id} className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                                <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white">{index + 1 + (page - 1) * limit}</Table.Cell>
                                <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white">{capitalized(item.name)}</Table.Cell>
                                <Table.Cell className="flex space-x-2 px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <Button className={editBtnStyle.btn} onClick={() => handleEdit(item)} size="xs"><HiPencil className={editBtnStyle.icon} /></Button>
                                    <Button onClick={() => confirmDelete(item._id)} className={deleteBtnStyle.btn} size="xs"><RiDeleteBin6Line className={deleteBtnStyle.icon} /></Button>
                                </Table.Cell>
                            </Table.Row>
                        )) : !isLoading && (
                            <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                                <Table.Cell colSpan={10} className="text-center py-4 text-DARK-500">
                                    <NoData 
                                        title="No Security Found"
                                        message="No security entries are available right now. Added security entries will appear here."
                                    />
                                </Table.Cell>
                            </Table.Row>
                        )}
                    </Table.Body>
                </Table>
                {numOfRecords > 0 &&
                    <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-DARK-200 dark:border-DARK-700 ">
                        {numOfRecords > 10 && <div className="text-sm text-DARK-600 dark:text-DARK-300 mb-4 sm:mb-0">
                            <PageSize
                                handleLimit={handleLimit}
                            />
                        </div>}
                        <div className="float-right">
                            <Pagination
                                className="pagination-bar"
                                currentPage={page}
                                totalCount={numOfRecords}
                                pageSize={limit}
                                onPageChange={(x: any) => curPage(x)}
                            />
                        </div>
                    </div>}
            </div>
            <Modal show={isOpenModal} onClose={onCloseModal} className="backdrop-blur-sm dark:bg-DARK-950">
                <Modal.Header className="dark:bg-DARK-800">Security Entry Form</Modal.Header>
                <Modal.Body className="dark:bg-DARK-800">
                    <form>
                        <div className="y-6 space-y-2">
                            <Label htmlFor="name" className="block text-sm font-medium text-DARK-700">
                                Name
                            </Label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                className="w-full px-3 py-2 dark:bg-DARK-700 dark:text-DARK-200  dark:placeholder:text-DARK-400 dark:border-none border bg-DARK-100 rounded-md"
                                placeholder="Enter name"
                                value={formData.name}
                                onChange={handleChange}
                            />
                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                        </div>
                    </form>
                </Modal.Body>
                <Modal.Footer className="justify-end dark:bg-DARK-800">
                    <Button
                        type="button"
                        onClick={() => onCloseModal()}
                        disabled={isButtonLoading}
                        className="w-full max-w-[150px] px-2 py-1 bg-SECONDARY text-white dark:bg-DARK-700 dark:hover:!bg-DARK-600 rounded-lg font-medium shadow-sm hover:bg-SECONDARY_HOVER focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        onClick={(e: any) => handleSubmit(e)}
                        disabled={isButtonLoading}
                        isProcessing={isLoading}
                        processingSpinner={<AiOutlineLoading className="h-6 w-6 animate-spin" />}
                        className="w-full max-w-[150px] px-2 py-1 bg-BRAND-500 text-white dark:bg-BRAND-500  dark:text-white rounded-lg font-medium shadow-sm hover:!bg-BRAND-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                    >
                        <span className="relative z-10">{isButtonLoading ? "Loading..." : (formData._id ? "Update" : "Submit")}</span>
                        {isLoading && (
                            <span className="absolute inset-0 bg-BRAND-600 opacity-20 animate-pulse"></span>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
            <ConfirmModal
                isOpen={isDeleteOpen}
                message="Are you sure you want to delete this security entry?"
                onConfirm={handleDelete}
                onCancel={() => setIsDeleteOpen(false)}
            />
        </div>
    );
}

export default Security;
