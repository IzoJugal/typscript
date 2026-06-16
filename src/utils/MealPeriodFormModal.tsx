
import { Button, Checkbox, Label, Modal, Select, TextInput } from 'flowbite-react';
import React from 'react';
import { Company, ErrorState, IMealPeriod, mealPlan, Restaurant } from '../components/others/MealPeriods';
import { CompanyField, RestaurantField } from './functions';
import NewSingleDate from './common/NewSingleDate';
import { OWNER_ROLES, SUPER_ADMIN } from './common/constant';
import { AiOutlineLoading } from "react-icons/ai";


interface MealPeriodFormProps {
    isOpen: boolean;
    onClose: () => void;
    formData: IMealPeriod | any;
    errors: ErrorState;
    companies: Company[];
    restaurant: Restaurant[];
    months: string[];
    loginRole: string;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    handleSubmit: (e: React.MouseEvent<HTMLButtonElement>) => void;
    isButtonLoading: boolean
    dateObj: {
        selectSpecialDate: {
            startDate: Date | null;
            endDate: Date | null;
        };
        selectFromDate: {
            startDate: Date | null;
            endDate: Date | null;
        };
        selectToDate: {
            startDate: Date | null;
            endDate: Date | null;
        };
        handleSpecialDate: (value: { startDate: Date | null; endDate: Date | null }) => void;
        handleFromDate: (value: { startDate: Date | null; endDate: Date | null }) => void;
        handleToDate: (value: { startDate: Date | null; endDate: Date | null }) => void;
    } | any
}

const MealPeriodFormModal: React.FC<MealPeriodFormProps> = ({
    isOpen,
    onClose,
    formData,
    errors,
    companies,
    restaurant,
    months,
    loginRole,
    handleChange,
    handleSubmit,
    isButtonLoading,
    dateObj,
}) => {
    return (
        <Modal show={isOpen} onClose={onClose} className="backdrop-blur-sm">
            <Modal.Header> Meal Period Form</Modal.Header>
            <Modal.Body>
                <div className="space-y-6">
                    <div className={`grid ${loginRole === SUPER_ADMIN ? "grid-cols-1 sm:grid-cols-2" : ""} gap-4`}>
                        {loginRole === SUPER_ADMIN && (
                            <div className="flex flex-col">
                                <CompanyField
                                    companies={companies}
                                    selectedCompanyId={formData?.company?._id || formData?.company}
                                    handleChange={handleChange}
                                    error={errors.company}
                                />
                            </div>
                        )}
                        {OWNER_ROLES.includes(loginRole) && (<div className="flex flex-col">
                            <RestaurantField
                                restaurants={restaurant}
                                selectedRestaurantId={formData?.restaurant?._id || formData?.restaurant}
                                handleChange={handleChange}
                                error={errors.restaurant}
                            />
                        </div>)}
                    </div>
                    <div>
                        <Label htmlFor="name" value="Name" />
                        <TextInput
                            id="name"
                            name="name"
                            placeholder="Meal Period Name"
                            type="text"
                            value={formData.name || ''}
                            onChange={handleChange}
                        />
                        {errors.name && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.name}</p>}
                    </div>

                    <div>
                        <Label htmlFor="mealPlan" value="Meal Plan" />
                        <div className="flex gap-4">
                            {mealPlan.map((plan) => (
                                <div className="flex items-center" key={plan}>
                                    <input
                                        type="radio"
                                        id={plan}
                                        name="mealPlan"
                                        value={plan}
                                        checked={formData.mealPlan === plan}
                                        onChange={handleChange}
                                        className="checked:bg-BRAND-500 !ring-0"
                                    />
                                    <Label htmlFor={plan} className="ml-2 capitalize cursor-pointer">
                                        {plan}
                                    </Label>
                                </div>
                            ))}
                        </div>
                        {formData.mealPlan !== 'time' && <div className="flex items-center gap-2 my-3">
                            <Checkbox className="checked:bg-BRAND-500 !ring-0" id="isFullDay" name="isFullDay" checked={formData?.isFullDay} onChange={handleChange} />
                            <Label htmlFor="isFullDay">Full Day</Label>
                        </div>}
                        {(!formData?.isFullDay || formData.mealPlan === 'time') && <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="startTime" value="Start Time" />
                                <TextInput
                                    id="startTime"
                                    type="time"
                                    name="startTime"
                                    value={formData.startTime}
                                    onClick={(e) => e.currentTarget.showPicker()}
                                    onChange={handleChange}
                                />
                                {errors.startTime && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.startTime}</p>}
                            </div>
                            <div>
                                <Label htmlFor="endTime" value="End Time" />
                                <TextInput
                                    id="endTime"
                                    type="time"
                                    name="endTime"
                                    value={formData.endTime}
                                    onClick={(e) => e.currentTarget.showPicker()}
                                    onChange={handleChange}
                                />
                                {errors.endTime && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.endTime}</p>}
                            </div>
                        </div>}

                        {/* {formData.mealPlan === 'time' && (
                            <>
                                <div className="mt-2 grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="timeStartTime" value="Start Time" />
                                        <TextInput
                                            id="timeStartTime"
                                            type="time"
                                            name="timeStartTime"
                                            value={formData?.time?.timeStartTime || formData.startTime}
                                            onClick={(e) => e.currentTarget.showPicker()}
                                            onChange={handleChange}
                                        />
                                        {errors.timeStartTime && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.timeStartTime}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="timeEndTime" value="End Time" />
                                        <TextInput
                                            id="timeEndTime"
                                            type="time"
                                            name="timeEndTime"
                                            value={formData?.time?.timeEndTime || formData.endTime}
                                            onClick={(e) => e.currentTarget.showPicker()}
                                            onChange={handleChange}
                                        />
                                        {errors.timeEndTime && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.timeEndTime}</p>}
                                    </div>
                                </div>
                                <p className="mt-2 text-sm text-gray-600 text-opacity-80" >
                                    <span className='font-semibold text-red-500'>Note:</span> The plan time start and end times will be the default for the start and end dates of the meal period. Users can change these dates as per their requirement.
                                </p>
                            </>)} */}

                        {formData.mealPlan === 'day' && (
                            <div className='mt-2'>
                                <div className="mb-2 block">
                                    <Label htmlFor="specialDayName" className="block text-sm font-medium text-gray-700 mb-1">Special Day Name</Label>
                                </div>
                                <TextInput
                                    id="specialDayName"
                                    type="text"
                                    name="specialDayName"
                                    value={formData?.day?.specialDayName}
                                    onChange={handleChange}
                                    placeholder="Enter the name of the special day (e.g., Valentine's Day)"
                                    className="cursor-pointer"
                                />
                                {errors.specialDayName && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.specialDayName}</p>}
                                <div>
                                    <label htmlFor="specialDayDate" className="block text-sm font-medium text-gray-700 mb-1">Special Day Date</label>
                                    <NewSingleDate
                                        value={dateObj?.selectSpecialDate}
                                        onChange={dateObj?.handleSpecialDate}
                                        label="Special Day Date"
                                    />
                                    {errors.specialDayDate && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.specialDayDate}</p>}
                                </div>
                            </div>
                        )}

                        {formData.mealPlan === 'week' &&
                            <div className='mt-2'>
                                <div className="mb-2 block">
                                    <Label htmlFor="weekMonth" className="block text-sm font-medium text-gray-700 mb-1">Select Month</Label>
                                </div>
                                <Select
                                    id="weekMonth"
                                    name="weekMonth"
                                    value={formData?.week?.weekMonth}
                                    onChange={handleChange}
                                    className="cursor-pointer"
                                >
                                    <option value="">Select a month</option>
                                    {months.map((month) => (
                                        <option key={month} value={month}>{month}</option>
                                    ))}
                                </Select>
                                {errors?.weekMonth && <p className="mt-1 text-sm text-ERROR_HOVER">{errors?.weekMonth}</p>}

                                <div className="mt-2 grid grid-cols-2 gap-4">
                                    <div>
                                        <div>
                                            <label htmlFor="weekStartDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                            <NewSingleDate
                                                value={dateObj?.selectFromDate}
                                                onChange={dateObj?.handleFromDate}
                                                label="Start Date"
                                            />
                                            {errors.weekStartDate && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.weekStartDate}</p>}
                                        </div>
                                    </div>

                                    <div>
                                        <div>
                                            <label htmlFor="weekEndDate" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                            <NewSingleDate
                                                value={dateObj?.selectToDate}
                                                onChange={dateObj?.handleToDate}
                                                label="End Date"
                                            />
                                            {errors.weekEndDate && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.weekEndDate}</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        }

                        {formData.mealPlan === 'month' && (
                            <div className='mt-2'>
                                <div className="mb-2 block">
                                    <Label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">Select Month</Label>
                                </div>
                                <Select
                                    id="month"
                                    name="month"
                                    value={formData?.month}
                                    onChange={handleChange}
                                    className="cursor-pointer"
                                >
                                    <option value="">Select a month</option>
                                    {months.map((month) => (
                                        <option key={month} value={month}>{month}</option>
                                    ))}
                                </Select>
                                {errors?.month && <p className="mt-1 text-sm text-ERROR_HOVER">{errors?.month}</p>}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Checkbox className="checked:bg-BRAND-500 !ring-0" id="isActive" name="isActive" checked={formData.isActive} onChange={handleChange} />
                        <Label htmlFor="isActive">Active</Label>
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer className="justify-end">
                <Button
                    type="button"
                    onClick={() => onClose()}
                    disabled={isButtonLoading}
                    className="w-full max-w-[150px] px-2 py-1 bg-SECONDARY text-white rounded-lg font-medium shadow-sm hover:!bg-SECONDARY_HOVER focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    onClick={(e: any) =>  handleSubmit(e)}
                    disabled={isButtonLoading}
                    isProcessing={isButtonLoading}
                    processingSpinner={<AiOutlineLoading className="h-6 w-6 animate-spin" />}
                    className="w-full max-w-[150px] px-2 py-1 bg-BRAND-500 text-white rounded-lg font-medium shadow-sm hover:!bg-BRAND-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                >
                    <span className="relative z-10">{isButtonLoading ? "Loading..." : (formData._id ? "Update" : "Submit")}</span>
                    {isButtonLoading && (
                        <span className="absolute inset-0 bg-BRAND-600 opacity-20 animate-pulse"></span>
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default MealPeriodFormModal;
