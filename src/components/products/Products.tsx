import {
  Button,
  Table
} from "flowbite-react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { HiPencil } from "react-icons/hi";
import { useCallback, useEffect, useRef, useState } from "react";
import apiClient from "../../utils/AxiosInstance";
import { RiDeleteBin6Line } from "react-icons/ri";
import { toast } from "react-toastify";
import ConfirmModal from "../../hooks/ConfirmModal";
import Pagination from "../Pagination/Pagination";
import { DetailHeaderPaths } from "../../utils/HeaderPaths";
import PageSize from "../Pagination/PageSize";
import TableHeaders from "../../utils/common/TableHeaders";
import { useAuth } from "../../context/AuthProvider";
import { Filters } from "../../utils/common/Filters";
import NoData from "../../utils/common/NoData";
import {
  deleteBtnStyle,
  editBtnStyle,
  SUPER_ADMIN,
  MANAGER_ROLES,
  divContainerStyle,
} from "../../utils/common/constant";
import { siteUrl } from "../../environment/env";
import {
  FaAngleDown,
  FaAngleUp,
  FaFileDownload,
  FaFilter
} from "react-icons/fa";
import { createQueryParams } from "../../utils/functions";
import { useSocket } from "../../context/SocketProvider";
import { capitalized, labelLayout, setTitle } from "../../utils/utility";
import * as XLSX from "xlsx";
import ListLoader from "../../utils/common/ListLoader";
import { ITranslation } from "./ProductForm";
import { useLanguage } from "../../context/LanguageContext";
import QuickBooksSyncModel from "../../utils/QuickBooksSyncModel";
import dayjs from "dayjs";
import SearchInput from "../../utils/common/SearchInput";
import AddActionButton from "../../utils/common/AddActionButton";
import ActionDropdown from "../../utils/common/ActionDropdown";
import { BiExport } from "react-icons/bi";
import { LuImport } from "react-icons/lu";

interface Modifier {
  name: string;
  description: string;
}

/* export type LanguageCode = typeof languages[number]['code'];
export type ITranslation = {
  [key in LanguageCode]?: string;
}; */

interface IProduct {
  _id: string;
  name: string;
  nameMl: ITranslation;
  description: ITranslation;
  price: string;
  sku: string;
  unit?: string;
  modifiers: Modifier[];
  company?: {
    name: string;
    currency?: {
      symbol?: string;
    };
  };
  restaurant?: {
    name: string;
  };
  category?: {
    name: string;
  };
  stock: string;
  isAvailable: boolean;
  itemColor?: string;
  fontColor?: string;
  fontSize?: string;
  fontType?: string;
  background?: string;
  type?: string;
  sellingPriceTaxType?: string;
  applicableTax?: string;
}
const Products = () => {
  setTitle("Products");
  const socket = useSocket();
  const { languageCode } = useLanguage();
  const { userData } = useAuth();
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
  const navigate = useNavigate();
  const [products, setProducts] = useState<IProduct[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBtnLoading, setIsBtnLoading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  // Filter states
  // const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { pages }: any = useParams<{ id: string }>();
  const [page, setPage] = useState<number>(+pages);
  const [numOfRecords, setNumOfRecords] = useState<number | any>(0);
  const location = useLocation();
  const commonColumns = [
    "Sr.No.",
    "Name",
    "Category",
    "Price",
    "Stock",
    "Status",
    "Actions",
  ];
  const superAdminColumns = [
    ...commonColumns.slice(0, 2),
    "Business",
    ...commonColumns.slice(2),
  ];
  const sortColumn = ["Name", "Price"];
  const columnNames =
    loginRole === SUPER_ADMIN ? superAdminColumns : commonColumns;
  const fileInputRef: any = useRef<HTMLInputElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [limit, setLimit] = useState(Number(searchParams.get("limit")) || 10);
  const staffCompanyId = loginRole !== SUPER_ADMIN
    ? (userData?.staffMember?.company?._id || "")
    : "";
  // const staffRestaurantId = loginRole !== SUPER_ADMIN && !OWNER_ROLES.includes(loginRole)
  //   ? (userData?.staffMember?.restaurant?._id || "")
  //   : "";
  const [searchFilter, setSearchFilter] = useState<any>({
    name: searchParams.get("name") || "",
    company: searchParams.get("company") || staffCompanyId,
    restaurant: searchParams.get("restaurant") || "",
    category: searchParams.get("category") || "",
  });

  const [formData, setFormData] = useState({
    page: parseInt(searchParams.get("page") || "1", 10),
    limit: parseInt(searchParams.get("limit") || "10", 10),
    sortBy: "createdAt",
    order: "desc",
  });
  const [btnLoader, setBtnLoader] = useState(false);

  const searchFilterRef = useRef(searchFilter);
  useEffect(() => {
    searchFilterRef.current = searchFilter;
  }, [searchFilter]);

  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const socketAllowDataPermission = (data: any) => {
    let status = false;
    if (loginRole === SUPER_ADMIN) {
      status = true;
    } else if (MANAGER_ROLES.includes(loginRole)) {
      if (
        userData?.staffMember?.company?._id ===
        (data?.company?._id || data?.company)
      ) {
        status = true;
      }
    } else if (!MANAGER_ROLES.includes(loginRole)) {
      if (
        userData?.staffMember?.company?._id ===
        (data?.company?._id || data?.company) &&
        userData?.staffMember?.restaurant?._id ===
        (data?.restaurant?._id || data?.restaurant)
      ) {
        status = true;
      }
    }
    return status;
  };

  useEffect(() => {
    const addProduct = (product: any) => {
      if (socketAllowDataPermission(product)) {
        setProducts((prevData: any) => {
          const updatedData = [...prevData];
          if (prevData?.length >= limit) {
            updatedData?.pop();
          }
          return [product, ...updatedData];
        });
        setNumOfRecords((prev: any) => prev + 1);
      }
    };
    const updateProduct = (product: any) => {
      setProducts((prevRecords) =>
        prevRecords.map((item) => (item._id === product._id ? product : item)),
      );
    };

    const deleteProduct = (productData: any) => {
      setProducts((prevRecords) => {
        const exists = prevRecords.some((item) => String(item._id) === String(productData._id));
        if (!exists) return prevRecords;
        const updated = prevRecords.filter((product) => product._id !== productData?._id);
        if (updated.length === 0) {
          if (page > 1) {
            curPage(page - 1);
          } else {
            curPage(1);
          }
        }
        return updated;
      });
      getProduct();
      setNumOfRecords((prev: any) => prev - 1);
    };

    socket.on("addProduct", addProduct);
    socket.on("updateProduct", updateProduct);
    socket.on("deleteProduct", deleteProduct);

    return () => {
      socket.off("addProduct", addProduct);
      socket.off("updateProduct", updateProduct);
      socket.off("deleteProduct", deleteProduct);
    };
  }, [socket]);

  const getProduct = useCallback(async () => {
    try {
      setIsLoading(true);
      const combinedData = {
        ...formDataRef.current,
        ...searchFilterRef.current,
      };
      const queryParams = createQueryParams(combinedData);
      const response = await apiClient.get(`/product${queryParams}`);
      if (response?.data?.status === true || response?.data?.success === true) {
        setProducts(response.data?.products);
        setNumOfRecords(response.data?.count);
      } else {
        setProducts([]);
        setNumOfRecords(0);
        if (response?.data?.success === false && response?.data?.error) {
          toast.error(
            response?.data?.message ||
            "There was an issue getting the product.",
          );
        }
      }

      setIsLoading(false);
    } catch (error: any) {
      setProducts([]);
      setIsLoading(false);
      console.error("~ getProduct error :-", error);
    }
  }, []);

  useEffect(() => {
    const debounceDelay = setTimeout(() => {
      getProduct();
    }, 300);
    return () => clearTimeout(debounceDelay);
  }, [page, limit, searchFilter, getProduct, location.search]);

  const handleLimit = (data: any) => {
    curPage(1);
    setLimit(data);
    setFormData((prev) => ({ ...prev, limit: data }));
  };

  const updateURL = (updatedFormData: any) => {
    const combinedData = { ...updatedFormData, ...searchFilterRef.current };
    const queryParams = createQueryParams(combinedData);

    setSearchParams(queryParams);
    navigate(`/product/${updatedFormData.page}/${queryParams}`);
  };

  const curPage = (pageNum: any) => {
    setIsLoading(true);
    setFormData((prev) => {
      const updatedFormData = { ...prev, page: pageNum };
      updateURL(updatedFormData);
      return updatedFormData;
    });
    setPage(pageNum);
  };

  useEffect(() => {
    if (
      Object.values(searchFilter).some((value) => value !== "") ||
      Object.values(searchFilter).every((value) => value === "")
    ) {
      if (formData?.page !== 1) {
        setFormData((prev) => ({ ...prev, page: 1 }));
        setPage(1);
      }
    }
  }, [searchFilter]);

  useEffect(() => {
    const pageFromURL = parseInt(searchParams.get("page") || "1", 10);
    const limitFromURL = parseInt(searchParams.get("limit") || "10", 10);

    setFormData((prev) => ({
      ...prev,
      page: pageFromURL,
      limit: limitFromURL,
    }));

    setPage(pageFromURL);
    setLimit(limitFromURL);
  }, []);

  const navigateSearchPrams = useCallback(() => {
    setIsLoading(true);
    updateURL(formDataRef.current);
    setLimit(formDataRef.current?.limit);
    setPage(formDataRef.current?.page);
  }, [searchFilter, formData]);

  useEffect(() => {
    navigateSearchPrams();
  }, [searchFilter, navigateSearchPrams]);

  const handleDelete = async () => {
    if (!selectedId) return;
    setIsModalOpen(false);
    const deleteId = selectedId;
    setSelectedId(null);
    try {
      setIsLoading(true);
      const response = await apiClient.post(`/product/${deleteId}`, {});
      if (response?.data?.success) {
        toast.success(response.data.message);
      } else {
        setIsLoading(false);
        toast.error(response?.data?.message);
      }

      setProducts((prev) => {
        const updated = prev.filter((product) => product._id !== deleteId);
        if (updated.length === 0) {
          if (page > 1) {
            curPage(page - 1);
          } else {
            curPage(1);
          }
        }
        return updated;
      });
      setNumOfRecords((prev: any) => prev - 1);
      getProduct();
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.log("Delete product error:", error);
      toast.error("Failed to delete the product. Please try again.");
    }
  };

  const confirmDelete = (id: string) => {
    setSelectedId(id);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      importProductData(file);
    }
  };

  const importProductData = async (file: any) => {
    if (!file) {
      toast.error("Please select a file to import");
      return;
    }

    const data = new FormData();
    data.append("file", file);

    try {
      setIsBtnLoading(true);
      const response = await apiClient.post(`/import-data/products`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data.success) {
        toast.success("Data imported successfully");
        getProduct();
      } else {
        toast.error(response?.data?.message || "Failed to import data");
      }
      console.log("Data imported successfully", response);
    } catch (error) {
      toast.error("An error occurred while importing data");
      console.error("Error importing products:", error);
    } finally {
      setIsBtnLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const exportToExcel = async () => {
    try {
      setBtnLoader(true);

      const queryParams = createQueryParams(searchFilterRef.current);

      const response = await apiClient.get(
        `/product${queryParams}${queryParams ? "&" : "?"}source=excel`,
      );

      const { success, message, products } = response.data;

      if (!success || !products?.length) {
        toast.error(message || "No products found");
        return;
      }

      const allProducts: IProduct[] = products;

      const excelData = allProducts.map((item: any) => ({
        Name: item?.name,
        Description: item?.description,
        Price: item?.price,
        Unit: item?.unit,
        SKU: item?.sku,
        Stock: item?.stock,
        Category: item?.category?.name,
        ApplicableTax: item?.applicableTax,
        SellingPriceTaxType: item?.sellingPriceTaxType,
        Type: item?.type,
        Background: item?.background,
        FontType: item?.fontType,
        FontSize: item?.fontSize,
        FontColor: item?.fontColor,
        ItemColor: item?.itemColor,
      }));

      const ws = XLSX.utils.json_to_sheet(excelData);

      const wb = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(wb, ws, "Products");

      const currentDate = dayjs().format("YYYY-MM-DD");

      XLSX.writeFile(wb, `Products_${currentDate}.xlsx`);

      toast.success("Products exported successfully");
    } catch (error: any) {
      console.error("Error exporting to excel:", error);

      toast.error(
        error?.response?.data?.message || "Failed to export products",
      );
    } finally {
      setBtnLoader(false);
    }
  };

  const downloadTemplate = async () => {
    setTemplateLoading(true);
    try {
      const response = await apiClient.get(`${siteUrl}/files/products_template.xlsx`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = "products_template.xlsx";
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setTemplateLoading(false);
    }
  };

  const [showFilters, setShowFilters] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  // const { quickBooksData } = useQuickBooks();
  // const ActionButton = ({
  //   label,
  //   Icon,
  //   onClick,
  //   isLoading = false,
  //   tooltip,
  // }: any) => (
  //   <div className="relative group w-full sm:w-auto">
  //     <Button
  //       onClick={onClick}
  //       disabled={isLoading}
  //       className="bg-gradient-to-r from-BRAND-600 to-BRAND-500 text-white rounded-xl font-medium shadow-lg hover:brightness-110 transition-all duration-300 flex items-center justify-center w-full sm:w-auto border-0 !ring-0 dark:bg-DARK-800 dark:hover:bg-DARK-700 disabled:opacity-50 disabled:cursor-not-allowed"
  //     >
  //       {isLoading ? (
  //         <div className="flex items-center gap-2">
  //           <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
  //           {label}
  //         </div>
  //       ) : (
  //         <div className="flex items-center gap-2">
  //           {Icon && <Icon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />}
  //           {label}
  //         </div>
  //       )}
  //     </Button>
  //     <Tooltip msg={tooltip} />
  //   </div>
  // );

  // const Tooltip = ({ msg }: { msg: string }) => (
  //   <span className="absolute left-1/2 transform -translate-x-1/2 bottom-12 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible text-white bg-black dark:bg-DARK-700 text-xs rounded-lg py-2 px-3 transition-all duration-200 ease-in-out shadow-lg scale-95 group-hover:scale-100 origin-top whitespace-nowrap">
  //     {msg}
  //     <span className="absolute left-1/2 transform -translate-x-1/2 bottom-[-8px] w-4 h-4 rotate-45 bg-black dark:bg-DARK-700"></span>
  //   </span>
  // );


  return (
    <div className={divContainerStyle}>
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <DetailHeaderPaths label="Products" />
        </div>

        {/* Filters Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
          <div className="flex gap-4 items-center flex-1 sm:flex-initial">
            <button
              className="flex items-center justify-center gap-1.5 text-[15px] font-medium text-BRAND-600 border border-BRAND-500 px-4 py-2.5 rounded-full bg-white dark:bg-DARK-800 dark:text-white dark:border-DARK-600 transition-all duration-300 hover:bg-BRAND-500 hover:text-white dark:hover:bg-DARK-500 dark:hover:text-white shrink-0"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter className="text-sm" />
              Filters
              {showFilters ? (
                <FaAngleUp className="transition-transform duration-300 h-4 w-4" />
              ) : (
                <FaAngleDown className="transition-transform duration-300 h-4 w-4" />
              )}
            </button>

            {!showFilters && (
              <SearchInput
                value={searchFilter.name}
                onChange={(val) => setSearchFilter((prev: any) => ({ ...prev, name: val }))}
                placeholder="Search..."
                className="h-[42px] self-center w-full max-w-xs"
              />
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              accept=".csv, .xlsx, .xls"
              disabled={isBtnLoading}
            />

            <ActionDropdown
              actions={[
                {
                  label: btnLoader ? "Exporting" : "Export",
                  Icon: BiExport,
                  loading: btnLoader,
                  onClick: exportToExcel,
                  disabled: products?.length === 0,
                },
                {
                  label: isBtnLoading ? "Importing" : "Import",
                  Icon: LuImport,
                  onClick: handleButtonClick,
                  loading: isBtnLoading,
                },
                {
                  label: templateLoading ? "Downloading" : "Template",
                  Icon: FaFileDownload,
                  loading: templateLoading,
                  onClick: downloadTemplate,
                },
              ]}
            />

            <Link to="/product/add" className="inline-block">
              <AddActionButton text="Add a new product" />
            </Link>
          </div>
        </div>

        <div
          className={`transition-all duration-500 ease-in-out ${showFilters ? "max-h-screen opacity-100 mt-3" : "max-h-0 opacity-0 overflow-hidden"
            }`}
        >
          <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-4">
            <Filters
              searchFilter={searchFilter}
              loginRole={loginRole}
              setSearchFilter={setSearchFilter}
              module="product"
              setIsDropdownOpen={setIsDropdownOpen}
              isDropdownOpen={isDropdownOpen}
              userData={userData}
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-DARK-800 rounded-xl shadow-sm overflow-x-auto border-t-2 border-BRAND-300 dark:border-DARK-400">
        <Table hoverable>
          {/* <TableHeaders columnNames={columnNames} /> */}
          {/* <TableHeaders {...{ columnNames, formData, setFormData }} /> */}
          <TableHeaders
            columnNames={columnNames}
            formData={formData}
            setFormData={
              setFormData as React.Dispatch<
                React.SetStateAction<Record<string, any>>
              >
            }
            sortColumn={sortColumn}
          />

          <Table.Body className="divide-y">
            {isLoading && (
              <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                <Table.Cell colSpan={10} className="text-center py-4">
                  {/* <Loader /> */}
                  <ListLoader />
                </Table.Cell>
              </Table.Row>
            )}
            {products?.length > 0 && !isLoading
              ? products?.map((product, index) => (
                <Table.Row
                  key={product?._id}
                  className="bg-white dark:border-DARK-700 dark:bg-DARK-800"
                >
                  <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white">
                    {index + 1 + (page - 1) * limit}
                  </Table.Cell>
                  <Table.Cell
                    title={
                      product?.nameMl?.[languageCode]
                        ? capitalized(product?.nameMl?.[languageCode])
                        : (capitalized(product?.name) ?? "-")
                    }
                  >
                    <Link
                      to={`/product/edit/${product._id}`}
                      className="text-DARK-900 dark:text-white hover:text-BRAND-500 transition-colors duration-150 font-medium"
                    >
                      {product?.nameMl?.[languageCode]
                        ? capitalized(product?.nameMl?.[languageCode])
                        : (capitalized(product?.name) ?? "-")}
                    </Link>
                  </Table.Cell>

                  {loginRole === SUPER_ADMIN && (
                    <Table.Cell
                      className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300 truncate max-w-36"
                      title={capitalized(product?.company?.name)}
                    >
                      {capitalized(product.company?.name) ?? "-"}
                    </Table.Cell>
                  )}
                  <Table.Cell
                    className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300 truncate max-w-36"
                    title={capitalized(product?.category?.name)}
                  >
                    {capitalized(product.category?.name) ?? "-"}
                  </Table.Cell>

                  <Table.Cell
                    className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300 truncate max-w-36"
                    title={`${product?.company?.currency?.symbol || "$"}${product.price}`}
                  >
                    {product?.company?.currency?.symbol || "$"}
                    {product.price ?? "-"}
                  </Table.Cell>
                  <Table.Cell
                    className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300 truncate max-w-36"
                    title={product.stock}
                  >
                    {product.stock ?? "-"}
                  </Table.Cell>
                  <Table.Cell
                    className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300"
                    title={product.isAvailable ? "Available" : "Unavailable"}
                  >
                    {labelLayout(
                      product.isAvailable ? "Available" : "Unavailable",
                    )}
                  </Table.Cell>

                  <Table.Cell className="flex space-x-2 px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button
                      onClick={() => navigate(`/product/edit/${product._id}`)}
                      size="xs"
                      className={editBtnStyle.btn}
                    >
                      <HiPencil className={editBtnStyle.icon} />
                    </Button>
                    <Button
                      onClick={() => confirmDelete(product._id)}
                      className={deleteBtnStyle.btn}
                      size="xs"
                    >
                      <RiDeleteBin6Line className={deleteBtnStyle.icon} />
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))
              : isLoading === false && (
                <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                  <Table.Cell
                    colSpan={10}
                    className="text-center py-4 text-DARK-500"
                  >
                    <NoData
                      title="No Products Found"
                      message="No product entries are available right now. Added product entries will appear here."
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
                <PageSize handleLimit={handleLimit} limit={limit} />
              </div>
            )}
            <div>
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
      <ConfirmModal
        isOpen={isModalOpen}
        message="Are you sure you want to delete this product ?"
        onConfirm={handleDelete}
        onCancel={() => setIsModalOpen(false)}
      />
      {openModal && (
        <QuickBooksSyncModel
          syncType="product"
          openModal={openModal}
          setOpenModal={setOpenModal}
        />
      )}

      {/* {isHovered && (
        <Modal show={isHovered} onClose={() => setIsHovered(false)}>
          <Modal.Header>Products Excel Example</Modal.Header>
          <Modal.Body>
            <a
              href={`${siteUrl}/files/products.xlsx`}  // Link to your Excel file
              download="example_product.xlsx"  // This will trigger the file download
              className="text-blue-500 hover:underline"
            >
              Download Example Excel File
            </a>
          </Modal.Body>
        </Modal>
      )} */}
    </div>
  );
};

export default Products;
