import { useCallback, useEffect, useState } from "react";
import { DetailHeaderPaths } from "../../utils/HeaderPaths";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { Button, Table, ToggleSwitch } from "flowbite-react";
import TableHeaders from "../../utils/common/TableHeaders";
import ListLoader from "../../utils/common/ListLoader";
import { capitalized } from "../../utils/utility";
import NoData from "../../utils/common/NoData";
import PageSize from "../Pagination/PageSize";
import Pagination from "../Pagination/Pagination";
import {
  deleteBtnStyle,
  editBtnStyle,
  SUPER_ADMIN,
} from "../../utils/common/constant";
import { RiDeleteBin6Line } from "react-icons/ri";
import { HiPencil } from "react-icons/hi";
import { createQueryParams } from "../../utils/functions";
import apiClient from "../../utils/AxiosInstance";
import ConfirmModal from "../../hooks/ConfirmModal";
import SocialMediaForm from "./SocialMediaForm";
import { toast } from "react-toastify";
import { useSocket } from "../../context/SocketProvider";
import { useAuth } from "../../context/AuthProvider";
import { apiUrl } from "../../environment/env";
import AddActionButton from "../../utils/common/AddActionButton";
import CommonFilter from "../../utils/common/CommonFilter";

export interface ISocialMedia {
  _id: string;
  name: string;
  url: string;
  image: string;
  isActive?: boolean;
}

const SocialMedia = () => {
  const { userData } = useAuth();
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
  const [socialMedia, setSocialMedia] = useState<ISocialMedia[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { pages }: any = useParams<{ id: string }>();
  const [page, setPage] = useState<number>(+pages);
  const [numOfRecords, setNumOfRecords] = useState<number | any>(0);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [limit, setLimit] = useState(Number(searchParams.get("limit")) || 10);
  const [searchFilter, setSearchFilter] = useState<any>({
    name: searchParams.get("name") || "",
  });

  const [formData, setFormData] = useState({
    page: parseInt(searchParams.get("page") || "1", 10),
    limit: parseInt(searchParams.get("limit") || "10", 10),
  });
  const columnNames = ["Sr.No.", "Name", "URL", "Status", "Actions"];
  const [socialMediaId, setSocialMediaId] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [socialMediaData, setSocialMediaData] = useState<any>({});

  const getAllSocialMedia = useCallback(async () => {
    try {
      setIsLoading(true);
      const combinedData = {
        ...formData,
        ...searchFilter,
      };
      const queryParams = createQueryParams(combinedData);
      const response = await apiClient.get(`/social-media${queryParams}`);

      const data = response.data?.data.filter(
        (item: any) => item.isDelete === false
      );

      setTimeout(() => {
        setSocialMedia(data);
        setNumOfRecords(response.data.count);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      setSocialMedia([]);
      setIsLoading(false);
      console.error("~ getAllSocialMedia error :-", error + socialMediaData);
    }
  }, [formData, searchFilter]);

  useEffect(() => {
    const debounceDelay = setTimeout(() => {
      getAllSocialMedia();
    }, 500);
    return () => clearTimeout(debounceDelay);
  }, [page, limit, getAllSocialMedia, location.search]);

  const handleLimit = (data: any) => {
    curPage(1);
    setLimit(data);
    setFormData((prev) => ({ ...prev, limit: data }));
  };

  const updateURL = (updatedFormData: any) => {
    const combinedData = { ...updatedFormData, ...searchFilter };
    const queryParams = createQueryParams(combinedData);

    setSearchParams(queryParams);
    navigate(`/social-media/${updatedFormData.page}/${queryParams}`);
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
    updateURL(formData);
    setLimit(formData?.limit);
    setPage(formData?.page);
  }, [searchFilter, formData]);

  useEffect(() => {
    navigateSearchPrams();
  }, [searchFilter, navigateSearchPrams]);

  const socket = useSocket();
  const socketAllowDataPermission = () => {
    let status = false;
    if (loginRole === "Super Admin") {
      status = true;
    }
    return status;
  };

  useEffect(() => {
    const addSocialMedia = (socialData: any) => {
      if (socketAllowDataPermission()) {
        setSocialMedia((prevData: any) => {
          const prev = Array.isArray(prevData) ? prevData : [];
          const updatedData = [...prev];

          if (updatedData.length >= limit) {
            updatedData.pop();
          }

          return [socialData, ...updatedData];
        });
        setNumOfRecords((prev: any) => prev + 1);
      }
    };
    const updateSocialMedia = (socialData: any) => {
      setSocialMedia((prev: any) =>
        prev.map((item: any) =>
          item._id === socialData._id ? socialData : item
        )
      );
    };
    const deleteSocialMedia = (socialData: any) => {
      const exists = socialMedia?.some((item: any) => {
        return String(item._id) === String(socialData._id);
      });
      if (!exists) {
        setIsLoading(false);
        return;
      }
      const updatedSocialMedia = socialMedia?.filter(
        (c) => c._id !== socialData?._id
      );
      setSocialMedia(updatedSocialMedia);
      getAllSocialMedia();
      if (updatedSocialMedia?.length === 0) {
        // curPage(page - 1)
        if (page > 1) {
          curPage(page - 1);
        } else {
          curPage(1);
        }
      }
      setNumOfRecords(numOfRecords - 1);
    };

    socket.on("addSocialMedia", addSocialMedia);
    socket.on("updateSocialMedia", updateSocialMedia);
    socket.on("changeStatusSocialMedia", updateSocialMedia);
    socket.on("deleteSocialMedia", deleteSocialMedia);
    socket.on("softDeleteSocialMedia", deleteSocialMedia);

    return () => {
      socket.off("addSocialMedia", addSocialMedia);
      socket.off("updateSocialMedia", updateSocialMedia);
      socket.off("changeStatusSocialMedia", updateSocialMedia);
      socket.off("deleteSocialMedia", deleteSocialMedia);
      socket.off("softDeleteSocialMedia", deleteSocialMedia);
    };
  }, [socket, socialMedia]);

  const handleDelete = async () => {
    if (!selectedId) return;
    setIsModalOpen(false);
    setSelectedId(null);

    try {
      setIsLoading(true);
      const response = await apiClient.post(
        `/social-media/delete/${selectedId}`,
        {}
      );
      if (response?.data?.success) {
        // Remove the deleted item from the state
        setSocialMedia(
          (prev) => prev?.filter((item) => item._id !== selectedId) || []
        );
        setNumOfRecords((prev: any) => Math.max(0, prev - 1)); // Decrease the count

        // If the last item on the current page was deleted, go to previous page
        if (socialMedia?.length === 1 && page > 1) {
          curPage(page - 1);
        }

        toast.success(response.data.message);
      } else {
        toast.error(
          response?.data?.message || "Failed to delete the social media"
        );
      }
    } catch (error) {
      console.error("Delete social-media error:", error);
      toast.error("Failed to delete the social media. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    const hasValidFilter = Object.values(searchFilter).some(
      (value) => value !== ""
    );
    if (hasValidFilter) {
      setSearchFilter({});
    }
  };

  const handleEdit = (id: string) => {
    setSocialMediaId(id);
    setOpenModal(true);
  };

  const confirmDelete = (id: string) => {
    setSelectedId(id);
    setIsModalOpen(true);
  };

  // const imageOnError = (event: any) => {
  //     event.currentTarget.src = `/public/images/Image-not-found.png`;
  //     event.currentTarget.className = "object-cover h-10 w-10 rounded-[50%] mr-4";
  // };

  const fallbackSrc = "/images/Image-not-found.png";

  const imageOnError = (event: any) => {
    if (event.currentTarget.src.includes(fallbackSrc)) return;

    event.currentTarget.src = fallbackSrc;
    event.currentTarget.className = "object-cover h-10 w-10 rounded-[50%] mr-4";
  };

  const handleToggleChange = async (id: string, checked: boolean) => {
    try {
      setIsLoading(true);
      const response = await apiClient.patch(`/social-media/status/${id}`, {
        status: checked,
      });

      if (response?.data?.success) {
        toast.success(response.data.message);
        setIsLoading(false);
      } else {
        setIsLoading(false);
        toast.error(response?.data?.message);
      }
    } catch (error) {
      setIsLoading(false);
      console.log("change active status of social-media error:", error);
      toast.error(
        "Failed to change active status of the social media. Please try again."
      );
    }
  };

  const totalRecordsCount = socialMedia?.length || 0;

  return (
    <div className="px-4 sm:px-6 lg:px-8 flex flex-col gap-4">
      <div>
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <DetailHeaderPaths label="Social Media" />


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
          onClear={handleClear}
          totalItems={totalRecordsCount}
          placeholder="Search by name..."
          AddButton={
            <span onClick={() => setOpenModal(true)}>
              <AddActionButton text="Add a new social-media" />
            </span>
          }
        />
      </div>

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
            {socialMedia && socialMedia?.length > 0 && !isLoading
              ? socialMedia?.map((socialmedia, index) => (
                <Table.Row
                  key={socialmedia?._id}
                  className="bg-white dark:border-DARK-700 dark:bg-DARK-800"
                >
                  <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white">
                    {index + 1 + (page - 1) * limit}
                  </Table.Cell>
                  <Table.Cell
                    className="whitespace-nowrap font-medium text-DARK-900 dark:text-white"
                    title={capitalized(socialmedia.name)}
                  >
                    <span className="flex items-center">
                      <div className="h-10 w-10 mr-4">
                        <img
                          src={`${apiUrl}/${socialmedia.image}`}
                          onError={(e) => imageOnError(e)}
                          alt="social media"
                          loading="lazy"
                          className="object-cover w-full h-full rounded-[50%]"
                        />
                      </div>
                      <span>{capitalized(socialmedia.name) ?? "-"}</span>
                    </span>
                  </Table.Cell>
                  <Table.Cell
                    className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300"
                    title={socialmedia?.url}
                  >
                    {socialmedia?.url
                      ? socialmedia.url.length > 40
                        ? `${socialmedia.url.slice(0, 40)}...`
                        : socialmedia.url
                      : "-"}
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300">
                    <ToggleSwitch
                      checked={!!socialmedia?.isActive}
                      onChange={(e) =>
                        handleToggleChange(socialmedia?._id, e)
                      }
                      // label={socialmedia?.isActive ? 'Activated' : 'Deactivated'}
                      color="success"
                    />
                  </Table.Cell>
                  <Table.Cell className="flex space-x-2 px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button
                      className={editBtnStyle.btn}
                      onClick={() => handleEdit(socialmedia?._id)}
                      size="xs"
                    >
                      <HiPencil className={editBtnStyle.icon} />
                    </Button>
                    <Button
                      onClick={() => confirmDelete(socialmedia._id)}
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
                      title="No Social Media Found"
                      message="No social media records are available right now. Added social media records will appear here."
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
        message="Are you sure you want to delete this social media ?"
        onConfirm={handleDelete}
        onCancel={() => setIsModalOpen(false)}
      />
      <SocialMediaForm
        socialMediaId={socialMediaId}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        setOpenModal={setOpenModal}
        setSocialMediaData={setSocialMediaData}
        openModal={openModal}
        setSocialMediaId={setSocialMediaId}
      />
    </div>
  );
};

export default SocialMedia;
