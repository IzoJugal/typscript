import { Button, Toast } from 'flowbite-react';
import React, { useState, useRef, useEffect } from 'react';
import { HiCheck, HiExclamation, HiPlus, HiTrash } from 'react-icons/hi';
import apiClient from '../../../utils/AxiosInstance';
import { apiUrl } from '../../../environment/env';
import NumberInputPOS from '../../../utils/common/NumberInputPOS';

const GratuityForm = ({ restaurant, gratuities: gratuityData }: any) => {
    const [gratuities, setGratuities] = useState<any[]>([18]);
    const [errors, setErrors] = useState<{ [key: number]: string }>({});
    const [showToast, setShowToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success',
    });

    useEffect(() => {
        setGratuities(gratuityData);
    }, [gratuityData])

    const [isSubmitting, setIsSubmitting] = useState(false);
    const toastTimeoutRef = useRef<any | null>(null);

    const handleChange = (value: string, index: number) => {
        setGratuities(prev => {
            const updated = [...prev];
            updated[index] = value;
            return updated;
        });

        // validation
        if (value.trim() === '') {
            setErrors(prev => ({
                ...prev,
                [index]: 'Gratuity is required.'
            }));
            return;
        }

        const numValue = Number(value);

        if (numValue <= 0 || numValue > 100) {
            setErrors(prev => ({
                ...prev,
                [index]: 'It must be  1 and 100.'
            }));
        } else {
            setErrors(prev => {
                const copy = { ...prev };
                delete copy[index];
                return copy;
            });
        }
    };

    const addGratuity = () => {
        setGratuities((prev) => [...prev, ""]);
    };

    const removeGratuity = (index: number) => {
        setGratuities(prev => prev.filter((_, i) => i !== index));

        setErrors(prev => {
            const updated: { [key: number]: string } = {};

            Object.entries(prev).forEach(([key, value]) => {
                const idx = Number(key);

                if (idx < index) {
                    updated[idx] = value;
                } else if (idx > index) {
                    updated[idx - 1] = value;
                }
            });

            return updated;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: { [key: number]: string } = {};

        gratuities.forEach((g, index) => {
            const value = String(g ?? '').trim();

            if (!value) {
                newErrors[index] = 'Gratuity is required.';
            } else if (Number(value) <= 0 || Number(value) > 100) {
                newErrors[index] = 'Gratuity must be between 1 and 100.';
            }
        });

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            return;
        }

        setIsSubmitting(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            await apiClient.patch(`${apiUrl}/restaurant/${restaurant}`, { gratuity: gratuities });

            const message =
                gratuities?.length === 1
                    ? 'Gratuity saved successfully!'
                    : 'Gratuities saved successfully!';

            setShowToast({ show: true, message, type: 'success' });
        } catch {
            setShowToast({ show: true, message: 'Failed to save gratuities.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }

        // Auto-hide toast after 3 seconds
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = setTimeout(() => setShowToast((prev) => ({ ...prev, show: false })), 3000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-DARK-50 to-DARK-100 dark:from-DARK-900 dark:to-DARK-800 text-DARK-900 dark:text-DARK-100 p-4 sm:p-6 md:p-8 transition-colors duration-300 rounded-2xl">
            {/* Toast Notification */}
            {showToast.show && (
                <div className="fixed top-4 right-4 z-50 animate-in fade-in duration-300">
                    <Toast>
                        <div
                            className={`flex items-center justify-center w-8 h-8 rounded-full ${showToast.type === 'success'
                                ? 'bg-green-100 text-green-500 dark:bg-green-900 dark:text-green-300'
                                : 'bg-red-100 text-red-500 dark:bg-red-900 dark:text-red-300'
                                }`}
                        >
                            {showToast.type === 'success' ? (
                                <HiCheck className="h-5 w-5" />
                            ) : (
                                <HiExclamation className="h-5 w-5" />
                            )}
                        </div>
                        <div className="ml-3 text-sm font-normal">{showToast.message}</div>
                        <Toast.Toggle
                            onDismiss={() => setShowToast((prev) => ({ ...prev, show: false }))}
                            className="text-DARK-400 hover:text-DARK-900 dark:hover:text-white"
                        />
                    </Toast>
                </div>
            )}

            <div className="max-w-full mx-auto">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-1">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                            Gratuity Settings
                        </h1>
                        <p className="text-DARK-500 dark:text-DARK-400 text-sm mt-1">
                            Customize gratuity percentages for your service.
                        </p>
                    </div>
                    <Button
                        type="button"
                        onClick={addGratuity}
                        gradientDuoTone="redToYellow"
                        className="w-full sm:w-auto shadow-sm bg-BRAND-500 hover:!bg-BRAND-600 dark:bg-BRAND-500 dark:hover:!bg-BRAND-600"
                        aria-label="Add new gratuity percentage"
                    >
                        <span className="flex items-center gap-1">
                            <HiPlus className="h-4 w-4" />
                            Add Gratuity
                        </span>
                    </Button>
                </div>

                {/* Form Section */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {gratuities.map((g, index) => (
                            <div
                                key={`gratuity-${index}`}
                                className="relative bg-white dark:bg-DARK-800 p-4 sm:p-5 rounded-xl shadow-xs border border-DARK-100 dark:border-DARK-700 hover:shadow-sm transition-all duration-200 animate-in fade-in group"
                                role="group"
                                aria-labelledby={`gratuity-label-${g.id}`}
                            >
                                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-BRAND-400 to-BRAND-500 rounded-t-xl" />
                                <div className="flex flex-col gap-3 h-full">
                                    <div className="flex-grow">
                                        <label
                                            id={`gratuity-label-${g.id}`}
                                            className="block text-sm font-medium text-DARK-700 dark:text-DARK-300 mb-1.5"
                                        >
                                            Gratuity Percentage {index + 1}
                                        </label>
                                        <div className="relative">
                                            <NumberInputPOS
                                                className={`w-full pl-3 pr-8 py-2 rounded-lg border ${errors[index]
                                                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                                    : 'border-DARK-300 dark:border-DARK-600 focus:ring-BRAND-500 focus:border-emerald-500'
                                                    } bg-white dark:bg-DARK-700 text-DARK-900 dark:text-white transition-colors duration-200`}
                                                value={g || ""}
                                                onChange={(value) => handleChange(value, index)}
                                                allowDecimal={true}
                                                maxDecimalPlaces={2}
                                                placeholder="0.00"
                                                aria-describedby={errors[index] ? `error-${index}` : undefined}
                                                aria-invalid={!!errors[index]}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-DARK-500 dark:text-DARK-400 pointer-events-none">
                                                %
                                            </span>
                                        </div>
                                        {errors[index] && (
                                            <p
                                                id={`error-${index}`}
                                                className="text-red-600 dark:text-red-500 text-xs mt-1 whitespace-wrap"
                                                title={errors[index]}
                                            >
                                                {errors[index]}
                                            </p>
                                        )}
                                    </div>

                                    {gratuities.length > 1 && (
                                        <button
                                            type="button"
                                            className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 text-sm font-medium self-end mt-1 transition-colors duration-200 flex items-center gap-1"
                                            onClick={() => removeGratuity(index)}
                                            aria-label={`Remove gratuity ${index + 1}`}
                                        >
                                            <HiTrash className="h-4 w-4" />
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-8">
                        <Button
                            type="button"
                            // onClick={() => window.history.back()}
                            onClick={() => {
                                setGratuities(gratuityData || []);
                                setErrors({});
                            }}
                            disabled={gratuities.length === 0}
                            color="light"
                            className="w-full sm:w-auto"
                            aria-label="Cancel changes"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            // gradientDuoTone="redToYellow"
                            disabled={
                                isSubmitting ||
                                gratuities.length === 0 ||
                                Object.keys(errors).length > 0 ||
                                gratuities.some(g => String(g ?? '').trim() === '')
                            }
                            isProcessing={isSubmitting}
                            className="w-full sm:w-auto shadow-sm transition-transform hover:scale-[1.02]  bg-BRAND-500 hover:!bg-BRAND-600 dark:bg-BRAND-500 dark:hover:!bg-BRAND-600"
                            aria-label="Save gratuity changes"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GratuityForm;