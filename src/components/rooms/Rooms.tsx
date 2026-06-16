import { Button, Table, } from "flowbite-react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { HiPencil } from "react-icons/hi"
import { useCallback, useEffect, useRef, useState } from "react"
import apiClient from "../../utils/AxiosInstance"
import { RiDeleteBin6Line } from "react-icons/ri";
import { toast } from "react-toastify"
import ConfirmModal from "../../hooks/ConfirmModal"
import Pagination from "../Pagination/Pagination"
import { DetailHeaderPaths } from "../../utils/HeaderPaths"
import PageSize from "../Pagination/PageSize"
import TableHeaders from "../../utils/common/TableHeaders"
import { useAuth } from "../../context/AuthProvider"
import { Filters } from "../../utils/common/Filters"
import NoData from "../../utils/common/NoData"
import { deleteBtnStyle, divContainerStyle, editBtnStyle, MANAGER_ROLES, SUPER_ADMIN } from "../../utils/common/constant"
import { createQueryParams } from "../../utils/functions"
import { useSocket } from "../../context/SocketProvider"
import { capitalized, setTitle } from "../../utils/utility"
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import RoomForm from "./RoomForm"
import ListLoader from "../../utils/common/ListLoader"
import AddActionButton from "../../utils/common/AddActionButton"
import { FaAngleDown, FaAngleUp, FaFilter } from "react-icons/fa"
import SearchInput from "../../utils/common/SearchInput"



interface IRoom {
  _id: string
  name: string
  size: number,
  company: {
    name: string
  }
  amenities: []
}
const Rooms = () => {
  setTitle("Rooms");
  const { userData } = useAuth();
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
  const [rooms, setRooms] = useState<IRoom[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { pages }: any = useParams<{ id: string }>();
  const [page, setPage] = useState<number>(+pages);
  const [numOfRecords, setNumOfRecords] = useState<number | any>(0);
  // const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [limit, setLimit] = useState(Number(searchParams.get('limit')) || 10);
  const staffCompanyId = userData?.staffMember?.company?._id || "";
  const [searchFilter, setSearchFilter] = useState<any>({
    name: searchParams.get("name") || "",
    company: searchParams.get("company") || staffCompanyId,
    restaurant: searchParams.get("restaurant") || "",
  });
  const debounceRef = useRef<any | null>(null);

  const [formData, setFormData] = useState({
    page: parseInt(searchParams.get("page") || "1", 10),
    limit: parseInt(searchParams.get("limit") || "10", 10),
  });
  const columnNames = loginRole === SUPER_ADMIN
    ? ["Sr.No.", "Name", "Business", "Size (sqft)", "Amenities", "Actions"]
    : ["Sr.No.", "Name", "Size (sqft)", "Amenities", "Actions"];
  const [roomId, setRoomId] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [roomData, setRoomData] = useState<any>({});

  const getRoom = useCallback(async () => {
    try {
      setIsLoading(true)
      const combinedData = {
        ...formData,
        ...searchFilter
      };
      const queryParams = createQueryParams(combinedData);
      const response = await apiClient.get(`/table/room${queryParams}`,);
      setTimeout(() => {
        setRooms(response.data?.rooms);
        setNumOfRecords(response.data.count)
        setIsLoading(false)
      }, 500);
    } catch (error) {
      setRooms([])
      setIsLoading(false)
      console.error('~ getRoom error :-', error + roomData);
    }
  }, [formData, searchFilter,]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      getRoom();
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [page, limit, searchFilter, formData]);

  const handleLimit = (data: any) => {
    curPage(1)
    setLimit(data);
    setFormData((prev) => ({ ...prev, limit: data }))
  }

  const updateURL = (updatedFormData: any) => {
    const combinedData = { ...updatedFormData, ...searchFilter };
    const queryParams = createQueryParams(combinedData);

    setSearchParams(queryParams);
    navigate(`/room/${updatedFormData.page}/${queryParams}`);
  };

  const curPage = (pageNum: any) => {
    setIsLoading(true)
    setFormData((prev) => {
      const updatedFormData = { ...prev, page: pageNum };
      updateURL(updatedFormData);
      return updatedFormData;
    });
    setPage(pageNum);
  };

  useEffect(() => {
    if (Object.values(searchFilter).some((value) => value !== "") ||
      Object.values(searchFilter).every((value) => value === "")) {

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
    setLimit(formData?.limit)
    setPage(formData?.page);
  }, [searchFilter, formData,]);

  useEffect(() => {
    navigateSearchPrams();
  }, [searchFilter, navigateSearchPrams]);

  const handleDelete = async () => {
    if (!selectedId) return;
    setIsModalOpen(false);
    setSelectedId(null);

    try {
      setIsLoading(true)
      const response = await apiClient.post(`/table/room/${selectedId}`, {});
      const updatedRooms = rooms?.filter(room => room._id !== selectedId);
      setRooms(updatedRooms);
      if (response?.data?.success) {
        toast.success(response.data.message);
      } else {
        setIsLoading(false);
        toast.error(response?.data?.message);
      }
      getRoom();
      if (updatedRooms?.length === 0) {
        // curPage(page - 1)
        if (page > 1) {
          curPage(page - 1);
        } else {
          curPage(1);
        }
      }
      setTimeout(() => {
        setNumOfRecords(numOfRecords - 1)
        setIsLoading(false)
      }, 500);
    } catch (error) {
      setIsLoading(false)
      console.log('Delete room error:', error);
      toast.error('Failed to delete the room. Please try again.');
    }
  };

  const confirmDelete = (id: string) => {
    setSelectedId(id);
    setIsModalOpen(true);
  };

  const socket = useSocket()
  const socketAllowDataPermission = (data: any) => {
    let status = false
    if (loginRole === "Super Admin") {
      status = true
    } else if (MANAGER_ROLES.includes(loginRole)) {
      if (userData?.staffMember?.company?._id === (data?.company?._id || data?.company)) {
        status = true
      }
    } else if (!MANAGER_ROLES.includes(loginRole)) {
      if ((userData?.staffMember?.company?._id === (data?.company?._id || data?.company)) && userData?.staffMember?.restaurant?._id === (data?.restaurant?._id || data?.restaurant)) {
        status = true
      }
    }
    return status
  }

  useEffect(() => {
    const addRoom = (roomData: any) => {
      if (socketAllowDataPermission(roomData)) {
        setRooms((prevData: any) => {
          const prev = Array.isArray(prevData) ? prevData : [];
          const updatedData = [...prev];

          if (updatedData.length >= limit) {
            updatedData.pop();
          }

          return [roomData, ...updatedData];
        });
        setNumOfRecords((prev: any) => prev + 1);
      }
    };
    const updateRoom = (roomData: any) => {
      setRooms((prev: any) => prev.map((item: any) => item._id === roomData._id ? roomData : item));
    };
    const deleteRoom = (roomData: any) => {
      // setRooms((prev: any) => prev.filter((item: any) => item._id !== roomData._id));
      const exists = rooms?.some((item: any) => {
        return String(item._id) === String(roomData._id)
      });
      if (!exists) {
        setIsLoading(false)
        return
      };
      const updatedRooms = rooms?.filter(room => room._id !== roomData?._id);
      setRooms(updatedRooms);
      getRoom();
      if (updatedRooms?.length === 0) {
        // curPage(page - 1)
        if (page > 1) {
          curPage(page - 1);
        } else {
          curPage(1);
        }
      }
      setNumOfRecords(numOfRecords - 1)
    };

    socket.on("addRoom", addRoom);
    socket.on("updateRoom", updateRoom);
    socket.on("deleteRoom", deleteRoom);

    return () => {
      socket.off("addRoom", addRoom);
      socket.off("updateRoom", updateRoom);
      socket.off("deleteRoom", deleteRoom);
    };
  }, [socket, rooms]);
  const [showFilters, setShowFilters] = useState(false);

  const handleEdit = (id: string) => {
    setRoomId(id);
    setOpenModal(true);
  };

  const AmenitiesCell = ({ room }: any) => {
    const [expanded, setExpanded] = useState(false);

    const toggleExpanded = () => {
      setExpanded((prev) => !prev);
    };

    const amenities = room?.amenities || [];
    const showToggle = amenities.length > 2;
    const visibleAmenities = expanded ? amenities : amenities.slice(0, 2);

    return (
      <div className="flex flex-col gap-2 overflow-y-auto">
        {amenities.length > 0 ? (
          visibleAmenities.map((amenity: any, index: number) => (
            <div key={amenity} className="flex items-center">
              <span
                className="inline-block px-3 py-1.5 text-xs font-medium text-DARK-800 dark:text-DARK-100 bg-white dark:bg-DARK-900 rounded-full truncate max-w-40 hover:bg-DARK-100 dark:hover:bg-DARK-700 transition-colors duration-200 shadow-sm cursor-pointer border border-DARK-100 dark:border-DARK-700"
                title={amenity} >
                {amenity}
              </span>

              {index === 1 && showToggle && !expanded && (
                <button
                  onClick={toggleExpanded}
                  className="ml-2 w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full bg-DARK-200 dark:bg-DARK-700 hover:bg-DARK-300 dark:hover:bg-DARK-800 transition-colors duration-150"
                  title="Show all"
                >
                  <ChevronDownIcon className="w-4 h-4 text-DARK-700 dark:text-DARK-200" />
                </button>
              )}
            </div>
          ))
        ) : (
          <span className="text-DARK-500 dark:text-DARK-400">-</span>
        )}

        {expanded && showToggle && (
          <button
            onClick={toggleExpanded}
            className="w-6 h-6 mt-1 self-start flex items-center justify-center rounded-full bg-DARK-200 dark:bg-DARK-700 hover:bg-DARK-300 dark:hover:bg-DARK-800 transition-colors duration-150"
            title="Show less"
          >
            <ChevronUpIcon className="w-4 h-4 text-DARK-700 dark:text-DARK-200" />
          </button>
        )}
      </div>
    );
  }


  return (
    <div className={divContainerStyle}>
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <DetailHeaderPaths label="Rooms" />
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
           <div className="flex gap-4 items-center w-full sm:w-auto">
            <button
              className="flex items-center justify-center gap-1.5 text-[15px] font-medium text-BRAND-600 border border-BRAND-500 px-4 py-2.5 rounded-full bg-white dark:bg-DARK-800 dark:text-white dark:border-DARK-600 transition-all duration-300 hover:bg-BRAND-500 hover:text-white dark:hover:bg-DARK-500 dark:hover:text-white whitespace-nowrap"
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
                className="h-[42px] self-center"
              />
            )}
          </div>

          <div className="self-end sm:self-auto">
            <span onClick={() => setOpenModal(true)}>
              <AddActionButton text="Add a new room" />
            </span>
          </div>
        </div>

        <div
          className={`transition-all duration-500 ease-in-out ${showFilters ? "max-h-screen opacity-100 mb-4" : "max-h-0 opacity-0 overflow-hidden"
            }`}
        >
          <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-4">
            <Filters searchFilter={searchFilter} loginRole={loginRole} setSearchFilter={setSearchFilter} module="room" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-DARK-800 rounded-xl shadow-sm overflow-x-auto border-t-2 border-BRAND-300 dark:border-DARK-400">
        <Table hoverable>
          <TableHeaders columnNames={columnNames} />
          <Table.Body className="divide-y">
            {isLoading && <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
              <Table.Cell colSpan={8} className="text-center py-4">
                <ListLoader />
              </Table.Cell>
            </Table.Row>}
            {rooms && rooms?.length > 0 && !isLoading ?
              rooms?.map((room, index) => (
                <Table.Row key={room?._id} className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                  <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white">{index + 1 + (page - 1) * limit}</Table.Cell>
                  <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white" title={capitalized(room.name)}>{capitalized(room.name) ?? '-'}</Table.Cell>
                  {loginRole === SUPER_ADMIN && <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={capitalized(room?.company?.name)}>{capitalized(room?.company?.name) ?? '-'}</Table.Cell>}
                  <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={`${room.size}`}>{room.size ?? '-'}</Table.Cell>
                  <Table.Cell className="py-4 text-sm text-DARK-500 dark:text-DARK-300">
                    {/* <div className="flex flex-col gap-2  overflow-y-auto">
                      {room?.amenities?.length > 0 ? (
                        room.amenities.map((amenity) => (
                          <span
                            key={amenity}
                            className="inline-block px-2 py-1 text-xs font-normal text-DARK-700 dark:text-DARK-200 bg-DARK-100 dark:bg-DARK-700 rounded-md truncate max-w-36 hover:bg-DARK-200 dark:hover:bg-DARK-600 transition-colors duration-150"
                            title={amenity}
                          >
                            {amenity ?? '-'}
                          </span>
                        ))
                      ) : (
                        <span className="text-DARK-500 dark:text-DARK-400">-</span>
                      )}
                    </div> */}
                    <AmenitiesCell room={room} />
                  </Table.Cell>
                  <Table.Cell className="flex space-x-2 px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button className={editBtnStyle.btn} onClick={() => handleEdit(room?._id)} size="xs"><HiPencil className={editBtnStyle.icon} /></Button>
                    <Button onClick={() => confirmDelete(room._id)} className={deleteBtnStyle.btn} size="xs"><RiDeleteBin6Line className={deleteBtnStyle.icon} /></Button>
                  </Table.Cell>
                </Table.Row>
              ))
              : isLoading === false && <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                <Table.Cell colSpan={10} className="text-center py-4 text-DARK-500">
                  <NoData
                    title="No Rooms Found"
                    message="No room entries are available right now. Added room entries will appear here."
                  />
                </Table.Cell>
              </Table.Row>}
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
        message="Are you sure you want to delete this room ?"
        onConfirm={handleDelete}
        onCancel={() => setIsModalOpen(false)}
      />
      {openModal && (
      <RoomForm
        roomId={roomId}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        setOpenModal={setOpenModal}
        setRoomData={setRoomData}
        openModal={openModal}
        setRoomId={setRoomId}
      />
      )}
    </div>
  )
}

export default Rooms