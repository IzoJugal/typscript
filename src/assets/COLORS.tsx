//@ts-nocheck
const COLORS_MAIN = {
    PRIMARY: '#008080',
    BACKGROUNG_COLOR: '#F5F5F5',
    WHITE: '#ffffff',
    BLACK: '#000000',
    PLACEHOLDER_COLOR: '#808080',
    SECONDARY: '#fdb263',
    RED: '#f00',
    BLUE: '#00f',
    LIGHT_BLUE:"#43A6C6",
    GRAY_LIGHT: "#D3D3D3",
}

const COLORS1 = {
    PRIMARY: '#FD9D55', // Warm Orange
    BACKGROUND_COLOR: '#FFF5E5', // Light Peach
    WHITE: '#FFFFFF',
    BLACK: '#2B2B2B', // Dark Gray
    PLACEHOLDER_COLOR: '#A67C52', // Brownish Tint
    SECONDARY: '#FFA500', // Bright Orange
    RED: '#E63946', // Soft Red
    BLUE: '#1E90FF', // Dodger Blue
    LIGHT_BLUE: "#87CEEB", // Sky Blue
    GRAY_LIGHT: "#E0C9A6", // Beige
};

const COLORS2 = {
    PRIMARY: '#008080', // Teal
    BACKGROUND_COLOR: '#E0F2F1', // Light Aqua
    WHITE: '#FFFFFF',
    BLACK: '#2C3E50', // Deep Blue-Gray
    PLACEHOLDER_COLOR: '#5C8374', // Muted Green
    SECONDARY: '#20B2AA', // Light Sea Green
    RED: '#D72638', // Muted Red
    BLUE: '#1E88E5', // Royal Blue
    LIGHT_BLUE: "#5F9EA0", // Cadet Blue
    GRAY_LIGHT: "#B0C4DE", // Light Steel Blue
};

const COLORS3 = {
    PRIMARY: '#004466', // Deep Blue
    BACKGROUND_COLOR: '#D6EAF8', // Soft Blue Tint
    WHITE: '#FFFFFF',
    BLACK: '#1B2631', // Midnight Blue
    PLACEHOLDER_COLOR: '#5D6D7E', // Muted Blue Gray
    SECONDARY: '#2874A6', // Ocean Blue
    RED: '#E74C3C', // Soft Crimson
    BLUE: '#3498DB', // Strong Sky Blue
    LIGHT_BLUE: "#85C1E9", // Pastel Blue
    GRAY_LIGHT: "#D0D3D4", // Soft Cool Gray
};

const COLORS = {
PRIMARY: '#37474F', // Blue-Gray
BACKGROUND_COLOR: '#ECEFF1', //Steel Light 
WHITE: '#FFFFFF',
BLACK: '#102027', // Deep Slate
PLACEHOLDER_COLOR: '#78909C', // Muted Blue-Gray
SECONDARY: '#546E7A', // Cool Grayish Blue
RED: '#D50000', // Bright Red
BLUE: '#01579B', // Deep Ocean Blue

LIGHT_BLUE: "#29B6F6", // Vibrant Sky Blue
GRAY_LIGHT: "#CFD8DC", // Soft Steel Gray
SUCCESS: '#16C47F',
};

// const DARK_COLORS = {
//     PRIMARY: '#263238', // Dark Blue-Gray
//     BACKGROUND_COLOR: '#1C1C1E', // Almost Black
//     WHITE: '#E0E0E0', // Soft White
//     BLACK: '#000000', // True Black
//     PLACEHOLDER_COLOR: '#546E7A', // Muted Dark Blue-Gray
//     SECONDARY: '#37474F', // Deep Cool Gray
//     RED: '#B71C1C', // Dark Red
//     BLUE: '#0D47A1', // Dark Navy Blue
//     LIGHT_BLUE: "#1565C0", // Darker Vibrant Blue
//     GRAY_LIGHT: "#455A64", // Dark Steel Gray
//     SUCCESS: '#0E6B50', // Dark Green
// };


const COLORS5 = {
    PRIMARY: '#87CEEB', // Sky Blue
    BACKGROUND_COLOR: '#E0F7FA', // Light Aqua
    WHITE: '#FFFFFF',
    BLACK: '#263238', // Deep Charcoal
    PLACEHOLDER_COLOR: '#78909C', // Muted Blue Gray
    SECONDARY: '#4FC3F7', // Light Cyan Blue
    RED: '#D32F2F', // Soft Crimson Red
    BLUE: '#0288D1', // Deep Ocean Blue
    LIGHT_BLUE: "#81D4FA", // Soft Sky Blue
    GRAY_LIGHT: "#B0BEC5", // Cool Steel Gray
};

const COLORS6 = {
    PRIMARY: '#5DADEC', // Bright Sky Blue
    BACKGROUND_COLOR: '#E3F2FD', // Soft Baby Blue
    WHITE: '#FFFFFF',
    BLACK: '#1A237E', // Deep Indigo
    PLACEHOLDER_COLOR: '#90CAF9', // Muted Sky Blue
    SECONDARY: '#42A5F5', // Soft Blue
    RED: '#C62828', // Dark Red
    BLUE: '#1976D2', // Rich Blue
    LIGHT_BLUE: "#64B5F6", // Light Cerulean
    GRAY_LIGHT: "#BBDEFB", // Soft Cloud Blue
};

const COLORS26 = {
    PRIMARY: '#0D0D0D', // Almost Black
    BACKGROUND_COLOR: '#F2F2F2', // Light Gray
    WHITE: '#FFFFFF',
    BLACK: '#000000',
    PLACEHOLDER_COLOR: '#A6A6A6', // Medium Gray
    SECONDARY: '#1C1C1C', // Deep Charcoal
    RED: '#D72638', // Vivid Red
    BLUE: '#1E88E5', // Strong Blue
    LIGHT_BLUE: "#64B5F6", // Soft Sky Blue
    GRAY_LIGHT: "#D9D9D9", // Very Light Gray
};

const COLORS27 = {
    PRIMARY: '#1A1A2E', // Midnight Blue
    BACKGROUND_COLOR: '#E3F2FD', // Soft Baby Blue
    WHITE: '#FFFFFF',
    BLACK: '#0D0D0D',
    PLACEHOLDER_COLOR: '#5C677D', // Muted Steel Blue
    SECONDARY: '#16213E', // Dark Navy
    RED: '#C0392B', // Rich Red
    BLUE: '#2980B9', // Deep Ocean Blue
    LIGHT_BLUE: "#85C1E9", // Soft Blue
    GRAY_LIGHT: "#D0D3D4", // Light Cool Gray
};

const COLORS28 = {
    PRIMARY: '#212121', // Charcoal Gray
    BACKGROUND_COLOR: '#F5F5F5', // Off-White
    WHITE: '#FFFFFF',
    BLACK: '#000000',
    PLACEHOLDER_COLOR: '#9E9E9E', // Light Gray
    SECONDARY: '#424242', // Deep Gray
    RED: '#E53935', // Bright Red
    BLUE: '#1565C0', // Deep Blue
    LIGHT_BLUE: "#64B5F6", // Soft Blue
    GRAY_LIGHT: "#E0E0E0", // Pale Gray
};

const COLORS29 = {
    PRIMARY: '#0B132B', // Deep Navy
    BACKGROUND_COLOR: '#F1F1F1', // Pale Silver
    WHITE: '#FFFFFF',
    BLACK: '#0A0A0A',
    PLACEHOLDER_COLOR: '#AAB7B8', // Muted Gray
    SECONDARY: '#1C2541', // Muted Dark Blue
    RED: '#B71C1C', // Dark Red
    BLUE: '#0277BD', // Bold Blue
    LIGHT_BLUE: "#81D4FA", // Sky Blue
    GRAY_LIGHT: "#CFD8DC", // Soft Blue-Gray
};

const COLORS30 = {
    PRIMARY: '#2C3E50', // Dark Blue Gray
    BACKGROUND_COLOR: '#ECF0F1', // Soft Cloud White
    WHITE: '#FFFFFF',
    BLACK: '#17202A',
    PLACEHOLDER_COLOR: '#839192', // Cool Gray
    SECONDARY: '#34495E', // Steel Blue
    RED: '#D72638', // Strong Red
    BLUE: '#3498DB', // Vibrant Blue
    LIGHT_BLUE: "#A2D9CE", // Soft Teal
    GRAY_LIGHT: "#D5DBDB", // Light Gray
};

const COLORS31 = {
    PRIMARY: '#1B263B', // Dark Steel Blue
    BACKGROUND_COLOR: '#EFF6EE', // Soft Light Greenish Tint
    WHITE: '#FFFFFF',
    BLACK: '#0F0F0F',
    PLACEHOLDER_COLOR: '#576574', // Muted Grayish Blue
    SECONDARY: '#415A77', // Muted Navy
    RED: '#E63946', // Strong Crimson
    BLUE: '#457B9D', // Soft Blue
    LIGHT_BLUE: "#A8DADC", // Pastel Blue Green
    GRAY_LIGHT: "#BFC9CA", // Light Warm Gray
};

const COLORS32 = {
    PRIMARY: '#111D4A', // Dark Navy Blue
    BACKGROUND_COLOR: '#EAF2F8', // Soft Ice Blue
    WHITE: '#FFFFFF',
    BLACK: '#0B0C10',
    PLACEHOLDER_COLOR: '#5D6D7E', // Soft Blue-Gray
    SECONDARY: '#1F4068', // Muted Deep Blue
    RED: '#C2185B', // Raspberry Red
    BLUE: '#0D47A1', // Strong Royal Blue
    LIGHT_BLUE: "#64B5F6", // Muted Sky Blue
    GRAY_LIGHT: "#D6DBDF", // Light Blue-Gray
};

const COLORS33 = {
    PRIMARY: '#141E30', // Deep Dark Blue
    BACKGROUND_COLOR: '#E3E7EC', // Soft Cool Gray
    WHITE: '#FFFFFF',
    BLACK: '#0B0C10',
    PLACEHOLDER_COLOR: '#768692', // Muted Gray Blue
    SECONDARY: '#243B55', // Navy Gray
    RED: '#B71C1C', // Deep Red
    BLUE: '#1976D2', // Strong Blue
    LIGHT_BLUE: "#64B5F6", // Soft Blue
    GRAY_LIGHT: "#BFC9CA", // Light Cool Gray
};

const COLORS34 = {
    PRIMARY: '#232931', // Dark Graphite
    BACKGROUND_COLOR: '#EEEEEE', // Soft White
    WHITE: '#FFFFFF',
    BLACK: '#121212',
    PLACEHOLDER_COLOR: '#808080', // Classic Gray
    SECONDARY: '#393E46', // Charcoal Blue
    RED: '#E74C3C', // Soft Red
    BLUE: '#2980B9', // Deep Ocean Blue
    LIGHT_BLUE: "#81D4FA", // Pastel Blue
    GRAY_LIGHT: "#D5D8DC", // Light Neutral Gray
};

const COLORS35 = {
    PRIMARY: '#3D3D3D', // Dark Gunmetal Gray
    BACKGROUND_COLOR: '#F7F7F7', // Soft White Tint
    WHITE: '#FFFFFF',
    BLACK: '#121212',
    PLACEHOLDER_COLOR: '#9A9A9A', // Medium Gray
    SECONDARY: '#575757', // Deep Slate Gray
    RED: '#D32F2F', // Crimson Red
    BLUE: '#1E88E5', // Vibrant Blue
    LIGHT_BLUE: "#90CAF9", // Soft Sky Blue
    GRAY_LIGHT: "#E0E0E0", // Pale Gray
};

export default COLORS;
