import { useEffect, useRef, useState } from "react";
import { Modal, Button, TextInput } from "flowbite-react";
import { capitalized } from "../../utils/utility";
import { usePOS } from "../../context/POSProvider";
import { useAuth } from "../../context/AuthProvider";
import { recallOrder } from "../../utils/common/PosTerminalUtility";

const TableFloorPlan = ({ isFloorPlanOpen, setIsFloorPlanOpen, tableRooms }: any) => {
  const { userData } = useAuth();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const {
    rawPayload,
    setRawPayload,
    selectedRestaurant,
    tables,
    cart,
    setTables,
    setCart,
    setPosLocalData,
    setSelectedRestaurant,
    setSelectedCustomer,
  } = usePOS();

  const [isNoOfGuestOpen, setIsNoOfGuestOpen] = useState<boolean>(false);

  // Drag-to-scroll refs and state
  const floorPlanContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(true);
  const dragStart = useRef({ x: 0, y: 0 });
  const scrollStart = useRef({ left: 0, top: 0 });

  useEffect(() => {
    if (tableRooms?.length > 0 && !selectedRoomId) {
      setSelectedRoomId(tableRooms[0]._id);
    }
  }, [tableRooms, selectedRoomId]);

  useEffect(() => {
    const container = floorPlanContainerRef.current;
    if (!container) return;

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY };
      scrollStart.current = { left: container.scrollLeft, top: container.scrollTop };
      container.style.cursor = "grabbing";
      container.style.userSelect = "none";
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !container) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      container.scrollLeft = scrollStart.current.left - dx;
      container.scrollTop = scrollStart.current.top - dy;
    };

    const onMouseUp = () => {
      if (!container) return;
      setIsDragging(false);
      container.style.cursor = "grab";
      container.style.userSelect = "auto";
    };

    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    // Set initial cursor style
    container.style.cursor = "grab";

    return () => {
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      if (container) {
        container.style.cursor = "auto";
        container.style.userSelect = "auto";
      }
    };
  }, [selectedRoomId, isDragging]);

  const selectedRoom = tableRooms?.find((room: any) => room._id === selectedRoomId);

  const handleTableClick = (table: any) => {
    let guestExist = !rawPayload?.guestCount || rawPayload?.guestCount <= 0;
    if (guestExist) {
      setIsNoOfGuestOpen(true);
      // return;
    }

    setTables((prev: any[]) => {
      const isSelected = prev.some((t) => t._id === table._id);
      if (isSelected && !guestExist) {
        return prev.filter((t) => t._id !== table._id);
      } else {
        const updatedTables = [...prev, table];
        // If this is the FIRST table being selected (no previous selection),
        // the user is starting a brand-new order. Clear any stale recalled-order
        // state (_id, orderId, splitOrderId, etc.) so the backend creates a
        // fresh order instead of updating a previously-recalled one.
        const isStartingNewOrder = prev.length === 0;
        processTablesforCart(updatedTables, isStartingNewOrder);
        return updatedTables;
      }
    });

    const processTablesforCart = (updatedTables: any, isStartingNewOrder: boolean) => {
      const rawTable = {
        table: updatedTables[0]._id,
        room: selectedRoomId,
        mergedTables: updatedTables.filter((table: any) => table?._id).map((table: any) => table._id),
      };

      if (isStartingNewOrder) {
        // Build a clean payload for a new order — no _id, no orderId, no splitOrderId
        setRawPayload((prev: any) => ({
          orderType: 'table',
          productOrderType: 'quickService',
          isPay: false,
          restaurant: prev?.restaurant,
          guestCount: prev?.guestCount || 1,
          cartItems: [
            {
              table: rawTable,
              products: [],
            },
          ],
        }));
        setCart([]);
      } else {
        // Adding a merged table to the current selection — keep existing payload state
        setRawPayload((cartPrev: any) => ({
          ...cartPrev,
          cartItems: [
            {
              table: rawTable,
              products: cart,
            },
          ],
        }));
      }
    };
  };

  const isTableSelected = (tableId: string) => tables.some((t: any) => t._id === tableId);

  const openOrder = async (order: any) => {

    await recallOrder(order, {
      setPosLocalData,
      setRawPayload,
      setSelectedRestaurant,
      setSelectedCustomer,
      setCart,
      setTables,
    });
    setIsFloorPlanOpen(false);
  };

  const handleAddGuest = () => {
    const count = Number(rawPayload?.guestCount);

    if (!count || count < 1) return;

    setRawPayload((prev: any) => ({
      ...prev,
      guestCount: count,
    }));

    setIsNoOfGuestOpen(false);
  };

  return (
    <Modal
      show={isFloorPlanOpen}
      onClose={() => setIsFloorPlanOpen(false)}
      className="backdrop-blur-sm dark:bg-DARK-950"
      size="full"
      position="top-center"
    >
      <Modal.Header className="flex items-center justify-between dark:bg-DARK-800">
        <span className="text-lg font-semibold text-DARK-800 dark:text-white">Floor Plan</span>
      </Modal.Header>

      <Modal.Body className="space-y-6 dark:bg-DARK-900 scrollbar-none max-h-screen">
        {/* Rooms selector buttons */}
        <div className="flex flex-wrap gap-2">
          {tableRooms.map((room: any) => (
            <Button
              key={room._id}
              className={`focus:!ring-0 ${room._id === selectedRoomId ? "!bg-BRAND-600 hover:!bg-BRAND-500" : "!bg-slate-700 hover:!bg-slate-800"
                }`}
              onClick={() => {
                setSelectedRoomId(room._id);
                setTables([]);
              }}
            >
              {room.name}
            </Button>
          ))}
        </div>

        {selectedRoom && (
          <div
            key={selectedRoom._id}
            className="p-2 border rounded-lg shadow-sm bg-white dark:bg-DARK-800 dark:border-DARK-700"
          >
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-DARK-900 dark:text-white">{selectedRoom.name}</h2>
              <p className="text-sm text-DARK-600 dark:text-DARK-400">
                Size: {selectedRoom.size} sqft | Amenities: {selectedRoom.amenities.join(", ")}
              </p>
            </div>

            {/* Scrollable, draggable floor plan container */}
            <div
              ref={floorPlanContainerRef}
              className="relative overflow-auto border border-DARK-300 dark:border-DARK-700 rounded-lg bg-[linear-gradient(to_right,rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.05)_1px,transparent_1px)] dark:bg-[rgba(255,255,255,0.05)] scrollbar-hide"
              style={{
                width: "100%",
                // height: "500px",
                height: "55vh",
                cursor: isDragging ? "grabbing" : "grab",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: selectedRoom.sizeWidth || 1200,
                  height: selectedRoom.sizeHeight || 800,
                  minWidth: "100%",
                  minHeight: "100%",
                }}
              // className="bg-DARK-200 dark:bg-DARK-700"
              >
                {selectedRoom.tables.map((table: any) => {
                  const selected = isTableSelected(table._id);
                  const isOtherServer = table?.orders?.server?._id !== userData?.staffMember?._id;

                  const shapeStyles: any = {
                    width: table?.shape === "circle" ? table.size : table.size * 1.5,
                    height: table?.size,
                    borderRadius: table.shape === "circle" ? "50%" : table.shape === "oval" ? "50% / 50%" : "16px",
                    backgroundColor: selected ? "#3b82ff" : "#e5e7eb",
                    border: !table?.isFree ? (isOtherServer ? "5px solid red" : "5px solid red") : selected ? "2px solid #2563eb" : "1px solid #ccc",
                    color: selected ? "white" : "black",
                    cursor: table?.isFree ? "pointer" : "pointer",
                      opacity: table?.isFree ? 1 : 0.9,
                    position: "absolute",
                    top: table.initialY,
                    left: table.initialX,
                    padding: 8,
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    fontWeight: "600",
                    userSelect: "none",
                  };

                  return (
                    <div
                      key={table._id}
                      onClick={
                        table.isFree
                          ? () => handleTableClick(table)
                          : () => openOrder(table?.orders?._id)
                      }
                      style={shapeStyles}
                    >
                      <div className="border-b border-DARK-500">{capitalized(table.name)}</div>
                      <div style={{ fontSize: 10 }}>
                        {capitalized(table?.shape) || 'Square'} | Cap: {table.capacity}
                      </div>
                      <div className="text-xs">
                        {table.isFree ?
                          <span className="text-emerald-500">{'Free'}</span>
                          : <span>{table?.orders?.orderName}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tableRooms.length === 0 && (
          <div className="text-DARK-700 dark:text-slate-200">
            No rooms found in {selectedRestaurant?.name} Restaurant.
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="flex justify-end dark:bg-DARK-800">
        <Button
          onClick={() => {
            setIsNoOfGuestOpen(true);
          }}
          className="bg-slate-100 text-BRAND-500 hover:!bg-slate-200 dark:bg-DARK-700 dark:hover:!bg-BRAND-500 dark:text-white focus:!ring-0"
        >
          Add Guest
        </Button>
        <Button
          onClick={() => {
            setIsFloorPlanOpen(false);
          }}
          className="bg-slate-100 text-BRAND-500 hover:!bg-slate-200 dark:bg-DARK-700 dark:hover:!bg-BRAND-500 dark:text-white focus:!ring-0"
        >
          Confirm
        </Button>
      </Modal.Footer>

      <Modal
        show={isNoOfGuestOpen}
        onClose={() => setIsNoOfGuestOpen(false)}
        className="bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-all duration-300"
        size="md"
      >
        <Modal.Header className="bg-white dark:bg-DARK-800 border-b border-DARK-200 dark:border-DARK-700 px-6 py-4">
          <span className="text-xl font-semibold text-DARK-900 dark:text-white">Add Guest</span>
        </Modal.Header>
        <Modal.Body className="bg-DARK-100 dark:bg-DARK-900 p-6">
          <div className="space-y-4">
            <label
              htmlFor="guest-count"
              className="block text-sm font-medium text-DARK-700 dark:text-DARK-200"
            >
              Number of Guests
            </label>
            <TextInput
              id="guest-count"
              placeholder="Enter guest count"
              value={rawPayload?.guestCount || ""}
              onChange={(e: any) => {
                let value = e.target.value;
                value = value.replace(/[^0-9]/g, "");
                setRawPayload((prev: any) => ({
                  ...prev,
                  guestCount: value,
                }));
              }}
              className="mt-1"
              type="text"
              inputMode="numeric"
              min="1"
              step="1"
              required
            />
          </div>
        </Modal.Body>
        <Modal.Footer className="bg-white dark:bg-DARK-800 border-t border-DARK-200 dark:border-DARK-700 p-4 flex justify-end">
          <Button
            className="w-24 bg-slate-100 text-red-500 hover:!bg-slate-200 dark:bg-DARK-700 dark:hover:!bg-red-500 dark:text-white focus:!ring-0"
            onClick={() => setIsNoOfGuestOpen(false)}
          >
            Cancel
          </Button>
          <Button
            className="w-24 bg-slate-100 text-BRAND-500 hover:!bg-slate-200 dark:bg-DARK-700 dark:hover:!bg-BRAND-500 dark:text-white focus:!ring-0"
            onClick={handleAddGuest}
          >
            Add
          </Button>
        </Modal.Footer>
      </Modal>
    </Modal>
  );
};

export default TableFloorPlan;
