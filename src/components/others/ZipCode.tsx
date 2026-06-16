import { Button, Label, Modal, Table } from "flowbite-react";
import { useCallback, useEffect, useState } from "react";
import { HiPencil } from "react-icons/hi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { toast } from "react-toastify";
import { useLoading } from "../../context/LoadingContext";
import ConfirmModal from "../../hooks/ConfirmModal";
import apiClient from "../../utils/AxiosInstance";
import { DetailHeaderPaths } from "../../utils/HeaderPaths";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import Pagination from "../Pagination/Pagination";
import PageSize from "../Pagination/PageSize";
import TableHeaders from "../../utils/common/TableHeaders";
import NoData from "../../utils/common/NoData";
import { deleteBtnStyle, editBtnStyle } from "../../utils/common/constant";
import { createQueryParams } from "../../utils/functions";
import { useSocket } from "../../context/SocketProvider";
import { AiOutlineLoading } from "react-icons/ai";
import ListLoader from "../../utils/common/ListLoader";
// import { getCityState } from "../../utils/common/zipService";
import AddActionButton from "../../utils/common/AddActionButton";
import CommonFilter from "../../utils/common/CommonFilter";
import CommonInput from "../../utils/common/CommonInput";

interface IZip {
  _id?: string; // Optional for new entries
  zip: string;
  city: string;
  state: string; // Changed to string for state representation
}

interface ErrorState {
  zip?: string;
  city?: string;
  state?: string;
}

const ZipCode = () => {
  const [zipCodes, setZipCodes] = useState<IZip[]>([]);
  const { isButtonLoading, setIsButtonLoading } = useLoading();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [errors, setErrors] = useState<ErrorState>({});
  const [formData, setFormData] = useState<IZip>({
    _id: "",
    zip: "",
    city: "",
    state: "",
  });
  const { pages }: any = useParams<{ id: string }>();
  const [page, setPage] = useState<number>(+pages);
  const [numOfRecords, setNumOfRecords] = useState<number | any>(0);
  const [limit, setLimit] = useState(10);
  const location = useLocation();
  const navigate = useNavigate();

  // const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // const { userData } = useAuth();
  // const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchFilter, setSearchFilter] = useState<any>({
    name: searchParams.get("name") || "",
    restaurant: searchParams.get("restaurant") || "",
  });

  const [queryData, setQueryData] = useState({
    page: parseInt(searchParams.get("page") || "1", 10),
    limit: parseInt(searchParams.get("limit") || "10", 10),
    source: "web",
  });

  const columnNames = ["Sr.No.", "Zip Code", "City", "State", "Actions"];

  const getZipCodes = useCallback(async () => {
    try {
      setIsLoading(true);
      const combinedData = {
        ...queryData,
        ...searchFilter,
      };
      const queryParams = createQueryParams(combinedData);
      const response = await apiClient.get(`/zip${queryParams}`);
      setTimeout(() => {
        setZipCodes(response.data.data);
        setNumOfRecords(response.data.count);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      setTimeout(() => {
        setIsLoading(false);
        setZipCodes([]);
      }, 500);
      console.error(" ~ getZipCodes error :- ", error);
    }
  }, [setIsLoading, page, limit, searchFilter]);

  const handleChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "zip") {
      const zipValue = value.replace(/\D/g, "");
      const isZipCleared = zipValue.length === 0;

      setFormData((prev: any) => ({
        ...prev,
        zip: zipValue,
        city: isZipCleared ? "" : prev.city,
        state: isZipCleared ? "" : prev.state,
      }));

      setErrors((prev) => ({
        ...prev,
        zip: "",
        city: isZipCleared ? "" : prev.city,
        state: isZipCleared ? "" : prev.state,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const isValid = (): boolean => {
    let isValid = true;
    const errorMessage: Partial<ErrorState> = {};

    if (!formData.zip) {
      errorMessage.zip = "Please enter a valid zip code.";
      isValid = false;
    } else if (!/^\d{6}$/.test(formData.zip)) {
      errorMessage.zip = "Enter valid 6 digit zip code.";
      isValid = false;
    }

    if (!formData.city) {
      errorMessage.city = "Please enter a city.";
      isValid = false;
    }

    if (!formData.state) {
      errorMessage.state = "Please enter a state.";
      isValid = false;
    }

    setErrors({
      zip: errorMessage.zip || "",
      city: errorMessage.city || "",
      state: errorMessage.state || "",
    });
    return isValid;
  };

  const addEditZipCode = () => {
    setIsOpenModal(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isValid()) {
      try {
        // setIsLoading(true);
        setIsButtonLoading(true);
        let response: any;
        if (formData._id) {
          response = await apiClient.patch(`/zip/${formData._id}`, formData);
          if (response.data.success) {
            setTimeout(() => {
              toast.success(
                response?.data?.message || "Zip code updated successfully."
              );
              setIsButtonLoading(false);
              // setIsLoading(false);
              setZipCodes((prevZipCodes) =>
                prevZipCodes.map((zipCode) =>
                  zipCode._id === formData._id ? response.data.data : zipCode
                )
              );
            }, 500);
          } else {
            setIsButtonLoading(false);
            // setIsLoading(false);
            toast.error(
              response?.data?.message || "There was an issue with the request."
            );
          }
        } else {
          response = await apiClient.post("/zip/add", formData);
          if (response.data.success) {
            setTimeout(() => {
              setIsButtonLoading(false);
              // setIsLoading(false);
              toast.success(
                response?.data?.message || "Zip code added successfully."
              );

              // const newData = response.data.data
              // setZipCodes((prevData: any) => {
              //     const updatedData = [...prevData];
              //     if (prevData?.length >= limit) {
              //         updatedData?.pop();
              //     }
              //     return [newData, ...updatedData];
              // });
              // setNumOfRecords((prev: any) => prev + 1);
            }, 500);
          } else {
            setIsButtonLoading(false);
            // setIsLoading(false);
            toast.error(
              response?.data?.message || "There was an issue with the request."
            );
          }
        }

        setIsOpenModal(false);
        setFormData({
          _id: "",
          zip: "",
          city: "",
          state: "",
        });
      } catch (error: any) {
        setIsButtonLoading(false);
        // setIsLoading(false);
        console.log("Error during form submission:", error);
        toast.error(
          error?.response?.data?.message ||
          "There was an issue with the request."
        );
      }
    }
  };

  const handleEdit = (item: IZip) => {
    setFormData(item);
    setIsOpenModal(true);
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    setIsDeleteOpen(false);
    setSelectedId(null);
    try {
      setIsLoading(true);
      const response = await apiClient.post(`/zip/${selectedId}`, {});
      // const updatedZipCodes = zipCodes.filter(item => item._id !== selectedId);
      // getZipCodes();
      // if (updatedZipCodes?.length === 0) {
      //     // curPage(page - 1)
      //     if (page > 1) {
      //         curPage(page - 1);
      //     } else {
      //         curPage(1);
      //     }
      // }
      // setNumOfRecords(numOfRecords - 1)
      setTimeout(() => {
        // setZipCodes(updatedZipCodes);
        setIsLoading(false);
        if (response?.data?.success) {
          toast.success(response.data.message);
        } else {
          setIsLoading(false);
          toast.error(response?.data?.message);
        }
      }, 500);
    } catch (error) {
      setIsLoading(false);
      console.log("Delete zip code error:", error);
      toast.error("Failed to delete the zip code. Please try again.");
    }
  };

  const confirmDelete = (id: string) => {
    setSelectedId(id);
    setIsDeleteOpen(true);
  };

  const onCloseModal = () => {
    setFormData({
      _id: "",
      zip: "",
      city: "",
      state: "",
    });

    setErrors({});

    setIsOpenModal(false);
  };

  useEffect(() => {
    // const myParam: any = new URLSearchParams(location.search).get("page");
    // if (myParam) {
    //     setPage(myParam - 1);
    // }
    const debounceDelay = setTimeout(() => {
      getZipCodes();
    }, 500);
    return () => clearTimeout(debounceDelay);
  }, [page, limit, getZipCodes, location.search]);

  const handleLimit = (data: any) => {
    curPage(1);
    setLimit(data);
    setQueryData((prev) => ({ ...prev, limit: data }));
  };

  const updateURL = (updatedFormData: any) => {
    const combinedData = { ...updatedFormData, ...searchFilter };
    const queryParams = createQueryParams(combinedData);

    setSearchParams(queryParams);
    navigate(`/zip_code/${updatedFormData.page}/${queryParams}`);
  };

  const curPage = (pageNum: any) => {
    if (pageNum !== page) {
      setIsLoading(true);
      setQueryData((prev) => {
        const updatedFormData = { ...prev, page: pageNum };
        updateURL(updatedFormData);
        return updatedFormData;
      });
    }
    setPage(pageNum);
  };

  useEffect(() => {
    if (
      Object.values(searchFilter).some((value) => value !== "") ||
      Object.values(searchFilter).every((value) => value === "")
    ) {
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
    setLimit(queryData?.limit);
    setPage(queryData?.page);
  }, [searchFilter, queryData]);

  useEffect(() => {
    navigateSearchPrams();
  }, [searchFilter, navigateSearchPrams]);

  // const handleFilter = (value: string) => {
  //     setSearchFilter((prev: any) => ({ ...prev, company: value }))
  // }

  const handleClear = () => {
    const hasValidFilter = Object.values(searchFilter).some(
      (value) => value !== ""
    );
    if (hasValidFilter) {
      setSearchFilter({});
    }
  };

  const socket = useSocket();

  useEffect(() => {
    const addZipCode = (data: any) => {
      setZipCodes((prevData: any) => {
        const updatedData = [...prevData];
        if (prevData?.length >= limit) {
          updatedData?.pop();
        }
        return [data, ...updatedData];
      });
      setNumOfRecords((prev: any) => prev + 1);
    };

    const updateZipCode = (data: any) => {
      setZipCodes((prev: any) =>
        prev.map((item: any) => (item._id === data._id ? data : item))
      );
    };
    const deleteZipCode = (data: any) => {
      // setZipCodes((prev: any) => prev.filter((item: any) => item._id !== data._id));
      const exists = zipCodes?.some((item: any) => {
        return String(item._id) === String(data._id);
      });
      if (!exists) {
        setIsLoading(false);
        return;
      }
      const updatedZipCodes = zipCodes.filter((item) => item._id !== data?._id);
      getZipCodes();
      if (updatedZipCodes?.length === 0) {
        // curPage(page - 1)
        if (page > 1) {
          curPage(page - 1);
        } else {
          curPage(1);
        }
      }
      setNumOfRecords(numOfRecords - 1);
    };

    socket.on("addZipCode", addZipCode);
    socket.on("updateZipCode", updateZipCode);
    socket.on("deleteZipCode", deleteZipCode);

    return () => {
      socket.off("addZipCode", addZipCode);
      socket.off("updateZipCode", updateZipCode);
      socket.off("deleteZipCode", deleteZipCode);
    };
  }, [socket, zipCodes]);

const totalRecordsCount = zipCodes?.length || 0;

  return (
    <div className="px-4 sm:px-6 lg:px-8 flex flex-col gap-0">
      <div className="flex">
        <DetailHeaderPaths label="Zip Code" />
      </div>

      {/* Filters Section */}
      <CommonFilter
        searchValue={searchFilter?.name ?? ""}
        onSearchChange={(value) =>
          setSearchFilter((prev: any) => ({
            ...prev,
            name: value,
          }))
        }
        totalItems={totalRecordsCount}
        onClear={handleClear}
        placeholder="Search ZIP code..."
        AddButton={
          <span onClick={() => addEditZipCode()} className="w-full sm:w-auto block">
            <AddActionButton text="Add a new zipCode" />
          </span>
        }
      />

      <div className="bg-white dark:bg-DARK-800 rounded-xl shadow-sm overflow-x-auto border-t-2 border-BRAND-300 dark:border-DARK-400">
        <Table hoverable>
          <TableHeaders columnNames={columnNames} />

          <Table.Body className="divide-y">
            {isLoading && (
              <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                <Table.Cell colSpan={8} className="text-center py-4">
                  <ListLoader />
                </Table.Cell>
              </Table.Row>
            )}
            {!isLoading && zipCodes?.length > 0
              ? zipCodes?.map((item: any, index: number) => (
                <Table.Row
                  key={item._id}
                  className="bg-white dark:border-DARK-700 dark:bg-DARK-800"
                >
                  <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white">
                    {index + 1 + (page - 1) * limit}
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap font-medium text-DARK-700 dark:text-DARK-300">
                    {item.zip ?? "-"}
                  </Table.Cell>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-DARK-700 dark:text-DARK-300 border-DARK-200">
                    {item.city ?? "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-DARK-700 dark:text-DARK-300 border-DARK-200">
                    {item.state ?? "-"}
                  </td>
                  <Table.Cell className="flex space-x-2 px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button
                      className={editBtnStyle.btn}
                      onClick={() => handleEdit(item)}
                      size="xs"
                    >
                      <HiPencil className={editBtnStyle.icon} />
                    </Button>
                    <Button
                      onClick={() => confirmDelete(item._id)}
                      className={deleteBtnStyle.btn}
                      size="xs"
                    >
                      <RiDeleteBin6Line className={deleteBtnStyle.icon} />
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))
              : !isLoading && (
                <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                  <Table.Cell
                    colSpan={10}
                    className="text-center py-4 text-DARK-500"
                  >
                    <NoData
                      title="No ZIP Codes Found"
                      message="No ZIP code entries are available right now. Added ZIP code entries will appear here."
                    />
                  </Table.Cell>
                </Table.Row>
              )}
          </Table.Body>
        </Table>
        {numOfRecords > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-DARK-200 dark:border-DARK-700">
            {numOfRecords > 10 && (
              <div className="text-sm text-DARK-600 dark:text-DARK-300 mb-4 sm:mb-0">
                <PageSize handleLimit={handleLimit} />
              </div>
            )}
            <div className="float-right">
              <Pagination
                className="pagination-bar"
                currentPage={page}
                totalCount={numOfRecords}
                pageSize={limit}
                onPageChange={(x: any) => curPage(x)}
              />
            </div>
          </div>
        )}
      </div>

      <Modal
        show={isOpenModal}
        onClose={onCloseModal}
        className="backdrop-blur-sm dark:bg-DARK-950"
      >
        <Modal.Header className="dark:bg-DARK-800">Zip Code Form</Modal.Header>
        <Modal.Body className="dark:bg-DARK-800">
          <div className="space-y-6">
            <div>
              <div className="mb-2 block">
                <Label
                  htmlFor="city"
                  className="block text-sm font-medium text-DARK-700 mb-1"
                >
                  Zip Code
                </Label>
              </div>
              <CommonInput
                id="zip"
                name="zip"
                placeholder="Enter 6-digit ZIP code (e.g., 366521)"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={formData.zip || ""}
                onChange={handleChange}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"];
                  if (!allowedKeys.includes(e.key) && !/^\d$/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                className="w-full px-3 py-2 text-sm border-2 border-DARK-300 dark:border-none bg-slate-50  dark:placeholder:text-DARK-400 dark:text-DARK-200 rounded-xl"
              />
              {errors.zip && (
                <p className="mt-1 text-sm text-red-600">{errors.zip}</p>
              )}
            </div>
            <div>
              <div className="mb-2 block">
                <Label
                  htmlFor="city"
                  className="block text-sm font-medium text-DARK-700 mb-1"
                >
                  City
                </Label>
              </div>
              <CommonInput
                id="city"
                name="city"
                placeholder="Enter city name "
                value={formData.city}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border-2 border-DARK-300 dark:border-none bg-slate-50  dark:placeholder:text-DARK-400 dark:text-DARK-200 rounded-xl"
              />
              {errors.city && (
                <p className="mt-1 text-sm text-red-600">{errors.city}</p>
              )}
            </div>
            <div>
              <div className="mb-2 block">
                <Label
                  htmlFor="state"
                  className="block text-sm font-medium text-DARK-700 mb-1"
                >
                  State
                </Label>
              </div>
              <CommonInput
                id="state"
                name="state"
                placeholder="Enter state name"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border-2 border-DARK-300 dark:border-none bg-slate-50  dark:placeholder:text-DARK-400 dark:text-DARK-200 rounded-xl"
              />
              {errors.state && (
                <p className="mt-1 text-sm text-red-600">{errors.state}</p>
              )}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="justify-end dark:bg-DARK-800">
          <Button
            type="button"
            onClick={() => onCloseModal()}
            disabled={isButtonLoading}
            className="w-full max-w-[150px] px-2 py-1 bg-SECONDARY text-white dark:bg-DARK-700 dark:hover:!bg-DARK-600  rounded-lg font-medium shadow-sm hover:!bg-SECONDARY_HOVER focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={(e: any) => handleSubmit(e)}
            disabled={isButtonLoading}
            isProcessing={isButtonLoading}
            processingSpinner={
              <AiOutlineLoading className="h-6 w-6 animate-spin" />
            }
            className="w-full max-w-[150px] px-2 py-1 bg-BRAND-500 text-white dark:bg-BRAND-500 rounded-lg font-medium shadow-sm hover:!bg-BRAND-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
          >
            <span className="relative z-10">
              {isButtonLoading ? "Loading..." : "Submit"}
            </span>
            {isButtonLoading && (
              <span className="absolute inset-0 bg-BRAND-600 opacity-20 animate-pulse"></span>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
      <ConfirmModal
        isOpen={isDeleteOpen}
        message="Are you sure you want to delete this zip code?"
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
};

export default ZipCode;
