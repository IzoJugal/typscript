import { Modal, ModalHeader } from "flowbite-react";
import { allowedImageExtensions, allowedVideoExtensions } from "./constant";

interface MediaViewModalProps {
    show: boolean;
    onClose: () => void;
    url: string;
    extname: string;
}
const MediaView: React.FC<MediaViewModalProps> = ({ show, onClose, url, extname, }) => {

    const isImage = allowedImageExtensions.includes(extname);
    const isVideo = allowedVideoExtensions.includes(extname);

    const getFileNameFromPath = (filePath: string) => {
        if (!filePath) return "";
        const normalizedPath = filePath.replace(/\\/g, "/");
        return normalizedPath.split("/").pop() ?? "";
    };

    return (
        <Modal show={show}
            onClose={onClose}
            className="backdrop-blur-sm dark:bg-DARK-950"
        >
            <ModalHeader className="dark:bg-DARK-800">
                <span className="text-2xl font-bold text-DARK-900 dark:text-DARK-100 text-left">
                    {getFileNameFromPath(url) ?? "N/A"}
                </span>
            </ModalHeader>
            <Modal.Body className="dark:bg-DARK-800">
                {isImage && (
                    <img
                        src={url}
                        alt="Preview"
                        className="max-w-full max-h-[500px] rounded shadow"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder-image.png"; // Optional fallback
                        }}
                    />
                )}

                {isVideo && (
                    <video
                        controls
                        className="max-w-full max-h-[500px] rounded shadow"
                    >
                        <source src={url} type={`video/${extname}`} />
                        Your browser does not support the video tag.
                    </video>
                )}
            </Modal.Body>
        </Modal>
    )
}

export default MediaView;
