import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { usePOS } from './POSProvider';

const RightClickOnPOSTerminal = () => {
    const { clearPOS } = usePOS();
    const location = useLocation();
    const [visible, setVisible] = useState(false);
    const [coords, setCoords] = useState({ x: 0, y: 0 });

    const isPosAppPage = location.pathname === '/pos-app';

    const handleContextMenu = (e: any) => {
        if (!isPosAppPage) return;
        e.preventDefault();
        setCoords({ x: e.pageX, y: e.pageY });
        setVisible(true);
    };

    const handleClick = () => setVisible(false);

    const handleEscape = (e: any) => {
        if (e.key === 'Escape') setVisible(false);
    };

    useEffect(() => {
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('click', handleClick);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('click', handleClick);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isPosAppPage]);

    if (!visible) return null;

    return (
        <ul
            className="absolute bg-white shadow-lg rounded-md border border-gray-200 w-44 z-50"
            style={{ top: coords.y, left: coords.x }}
        >
            <li onClick={() => { clearPOS(); }} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">🔄 Refresh</li>
            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">🖨️ Print</li>
            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">⚙️ Settings</li>
        </ul>
    );
};

export default RightClickOnPOSTerminal;
