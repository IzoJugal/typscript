// common/ActionDropdown.tsx

import { Dropdown, DropdownItem } from "flowbite-react";
import React from "react";
import { HiDotsVertical } from "react-icons/hi";

interface IAction {
    label: string;
    Icon: React.ElementType;
    onClick: () => void;
    hidden?: boolean;
    loading?: boolean;
    disabled?: boolean;
    templateProcessing?: boolean;
}

interface Props {
    actions: IAction[];
}

const ActionDropdown = ({ actions }: Props) => {
    const loadingAction = actions.find((item) => item.loading);

    const isTemplateProcessing = actions.some(
        (item) => item.templateProcessing
    );

    const getLoadingText = (label: string) => {
        const lower = label.toLowerCase();

        if (lower.includes("import")) return "Importing...";
        if (lower.includes("export")) return "Exporting...";
        if (lower.includes("delete")) return "Deleting...";
        if (lower.includes("update")) return "Updating...";
        if (lower.includes("create")) return "Creating...";
        if (lower.includes("sync")) return "Syncing...";
        if (lower.includes("upload")) return "Uploading...";
        if (lower.includes("download")) return "Downloading...";
        if (lower.includes("template")) return "Template Processing...";

        console.log("label",label)

        return `${label}...`;
    };

    const loadingText = loadingAction
        ? getLoadingText(loadingAction.label)
        : "Actions More";
        

    const isAnyLoading = !!loadingAction;

    // Hide all actions while template processing
    if (isTemplateProcessing) {
        return (
            <div
                className="
                    flex items-center gap-2
                    px-4 py-2
                    rounded-xl
                    border
                    bg-gray-100
                    border-gray-300
                    text-gray-500
                    text-sm font-medium
                    dark:bg-slate-700
                    dark:border-slate-600
                    dark:text-slate-300
                "
            >
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />

                <span>Template Processing...</span>
            </div>
        );
    }

    return (
        <Dropdown
            inline
            arrowIcon={false}
            dismissOnClick={!isAnyLoading}
            renderTrigger={() => (
                <button
                    type="button"
                    disabled={isAnyLoading}
                    className={`
                        flex items-center gap-2
                        px-4 py-2
                        rounded-xl
                        border
                        transition-all
                        shadow-sm
                        whitespace-nowrap
                        text-sm font-medium

                        ${
                            isAnyLoading
                                ? `
                                    bg-gray-100
                                    border-gray-300
                                    text-gray-500
                                    cursor-not-allowed
                                    dark:bg-slate-700
                                    dark:border-slate-600
                                    dark:text-slate-300
                                  `
                                : `
                                    bg-BRAND-50
                                    border-BRAND-200
                                    text-BRAND-700
                                    hover:bg-BRAND-100
                                    dark:bg-slate-800
                                    dark:border-slate-700
                                    dark:text-white
                                  `
                        }
                    `}
                >
                    {isAnyLoading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />

                            <span>{loadingText}</span>
                        </>
                    ) : (
                        <>
                            <HiDotsVertical className="w-4 h-4 text-BRAND-600 dark:text-white" />

                            <span>Actions More</span>
                        </>
                    )}
                </button>
            )}
            className="w-60 rounded-xl"
        >
            {actions
                ?.filter((item) => !item.hidden)
                ?.map((item, index) => {
                    const Icon = item.Icon;

                    return (
                        <DropdownItem
                            key={index}
                            onClick={item.onClick}
                            disabled={item.loading || isAnyLoading || item.disabled}
                        >
                            <div className={`flex items-center gap-2 ${item.disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
                                {item.loading ? (
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Icon className="w-4 h-4" />
                                )}

                                <span>
                                    {item.loading
                                        ? getLoadingText(item.label)
                                        : item.label}
                                </span>
                            </div>
                        </DropdownItem>
                    );
                })}
        </Dropdown>
    );
};

export default ActionDropdown;