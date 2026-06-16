//@ts-nocheck
import { useCallback, useEffect, useState } from "react";
import { Button, Card, Dropdown, Navbar } from "flowbite-react";
import apiClient from "../../utils/AxiosInstance";

type MenuItem = {
    id: number;
    name: string;
    price: number;
    category: string;
};

type CartItem = {
    id: number;
    name: string;
    price: number;
    quantity: number;
};

const categories: string[] = ["All", "Food", "Drinks", "Desserts", "Specials"];

const menuItems: MenuItem[] = [
    { id: 1, name: "Burger", price: 9.99, category: "Food" },
    { id: 2, name: "Pizza", price: 12.49, category: "Food" },
    { id: 3, name: "Pasta", price: 10.99, category: "Food" },
    { id: 4, name: "Salad", price: 8.49, category: "Food" },
    { id: 5, name: "Soda", price: 2.99, category: "Drinks" },
    { id: 6, name: "Coffee", price: 3.49, category: "Drinks" },
    { id: 7, name: "Cake", price: 4.99, category: "Desserts" },
    { id: 8, name: "Ice Cream", price: 3.99, category: "Desserts" },
];

const PosApp = () => {
    const [restaurants, setRestaurants] = useState<any>();
    const [rooms, setRooms] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>("All");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState<boolean>(true);

    useEffect(() => {
        getTableRoom();
    }, []);

    const getTableRoom = useCallback(async () => {
        try {
            const response = await apiClient.get(`/table/tableroom`);
            if (response.data.success) {
                setRooms(response.data.rooms);
                setProducts(response.data.count);
            }
        } catch (error: any) {
            console.error('Error fetching table rooms:', error.message);
        }
    }, []);

    const addToCart = (item: MenuItem) => {
        setCart((prev) => {
            const existing = prev.find((cartItem) => cartItem.id === item.id);
            if (existing) {
                return prev.map((cartItem) =>
                    cartItem.id === item.id
                        ? { ...cartItem, quantity: cartItem.quantity + 1 }
                        : cartItem
                );
            }
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const updateQuantity = (id: number, delta: number) => {
        setCart((prev) =>
            prev
                .map((item) =>
                    item.id === id
                        ? { ...item, quantity: item.quantity + delta }
                        : item
                )
                .filter((item) => item.quantity > 0)
        );
    };

    const filteredItems = selectedCategory === "All"
        ? menuItems
        : menuItems.filter((item) => item.category === selectedCategory);

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <div className="flex h-screen bg-DARK-50">
            {/* Navbar for Mobile/Tablet */}
            <Navbar fluid className="lg:hidden bg-white shadow-md">
                <Navbar.Brand>
                    <span className="text-xl font-bold text-DARK-800">Restaurant POS</span>
                </Navbar.Brand>
                <Navbar.Toggle />
                <Navbar.Collapse>
                    {categories.map((cat) => (
                        <Navbar.Link
                            key={cat}
                            active={selectedCategory === cat}
                            onClick={() => setSelectedCategory(cat)}
                            className="text-DARK-700 hover:text-blue-600"
                        >
                            {cat}
                        </Navbar.Link>
                    ))}
                </Navbar.Collapse>
            </Navbar>

            {/* Sidebar for Desktop */}
            <aside className="hidden lg:block w-64 bg-white p-6 shadow-lg">
                <h2 className="text-2xl font-bold text-DARK-800 mb-6">Categories</h2>
                <ul className="space-y-3">
                    {categories.map((cat) => (
                        <li
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`p-3 rounded-lg cursor-pointer transition-all ${selectedCategory === cat
                                    ? "bg-blue-600 text-white"
                                    : "bg-DARK-100 text-DARK-700 hover:bg-DARK-200"
                                }`}
                        >
                            {cat}
                        </li>
                    ))}
                </ul>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-DARK-800">Menu</h1>
                    <Button
                        color="gray"
                        onClick={() => setIsCartOpen(!isCartOpen)}
                        className="lg:hidden"
                    >
                        {isCartOpen ? "Hide Cart" : "Show Cart"}
                    </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredItems.map((item) => (
                        <Card
                            key={item.id}
                            className="hover:shadow-xl transition-shadow"
                        >
                            <div className="w-full h-32 bg-DARK-200 rounded-lg mb-3" />
                            <h3 className="text-lg font-semibold text-DARK-800">{item.name}</h3>
                            <p className="text-sm text-DARK-500">${item.price.toFixed(2)}</p>
                            <Button
                                color="success"
                                onClick={() => addToCart(item)}
                                className="mt-3 w-full"
                            >
                                Add to Cart
                            </Button>
                        </Card>
                    ))}
                </div>
            </main>

            {/* Cart Panel */}
            <aside
                className={`${isCartOpen ? "block" : "hidden"
                    } lg:block w-full lg:w-96 bg-white p-6 shadow-lg transition-all`}
            >
                <h2 className="text-2xl font-bold text-DARK-800 mb-6">Cart</h2>
                {cart.length === 0 ? (
                    <p className="text-DARK-500">Your cart is empty.</p>
                ) : (
                    <>
                        <ul className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                            {cart.map((item) => (
                                <li
                                    key={item.id}
                                    className="flex justify-between items-center"
                                >
                                    <div>
                                        <p className="font-semibold text-DARK-800">{item.name}</p>
                                        <p className="text-sm text-DARK-500">
                                            ${item.price.toFixed(2)} x {item.quantity}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <Button
                                            size="xs"
                                            color="gray"
                                            onClick={() => updateQuantity(item.id, -1)}
                                        >
                                            -
                                        </Button>
                                        <span className="text-DARK-800">{item.quantity}</span>
                                        <Button
                                            size="xs"
                                            color="gray"
                                            onClick={() => updateQuantity(item.id, 1)}
                                        >
                                            +
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <div className="border-t pt-4">
                            <p className="text-lg font-semibold text-DARK-800">
                                Total: ${total.toFixed(2)}
                            </p>
                            <Button
                                color="blue"
                                className="w-full mt-4"
                                disabled={cart.length === 0}
                            >
                                Proceed to Checkout
                            </Button>
                        </div>
                    </>
                )}
            </aside>
        </div>
    );
};

export default PosApp;