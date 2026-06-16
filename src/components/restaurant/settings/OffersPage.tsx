import { Button, Toast } from 'flowbite-react';
import React, { useState, useRef, useEffect } from 'react';
import { HiCheck, HiExclamation } from 'react-icons/hi';
import apiClient from '../../../utils/AxiosInstance';
import { apiUrl } from '../../../environment/env';

const OffersPage = ({ restaurant, offers: initialOffers }: any) => {
  const [offers, setOffers] = useState<any[]>([]);
  const [newOffer, setNewOffer] = useState({ title: '', description: '', active: false });
  const [showToast, setShowToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toastTimeoutRef = useRef<any | null>(null);

  useEffect(() => {
    if (initialOffers) setOffers(initialOffers);
  }, [initialOffers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    setNewOffer((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const addOffer = async () => {
    if (!newOffer.title || !newOffer.description) {
      showTemporaryToast('Please complete all fields.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await apiClient.post(`${apiUrl}/restaurant/${restaurant}/offers`, newOffer);
      setOffers((prev) => [...prev, response.data]);
      setNewOffer({ title: '', description: '', active: false });
      showTemporaryToast('Offer added successfully!', 'success');
    } catch (error) {
      console.error(error);
      showTemporaryToast('Failed to add offer.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleOffer = async (id: number) => {
    const offer = offers.find((o) => o.id === id);
    if (!offer) return;

    try {
      const updated = { ...offer, active: !offer.active };
      await apiClient.patch(`${apiUrl}/restaurant/${restaurant}/offers/${id}`, updated);
      setOffers((prev) => prev.map((o) => (o.id === id ? updated : o)));
    } catch (error) {
      showTemporaryToast('Error updating offer status.', 'error');
    }
  };

  const deleteOffer = async (id: number) => {
    try {
      await apiClient.delete(`${apiUrl}/restaurant/${restaurant}/offers/${id}`);
      setOffers((prev) => prev.filter((o) => o.id !== id));
      showTemporaryToast('Offer deleted.', 'success');
    } catch (error) {
      showTemporaryToast('Failed to delete offer.', 'error');
    }
  };

  const showTemporaryToast = (message: string, type: 'success' | 'error') => {
    setShowToast({ show: true, message, type });
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setShowToast((prev) => ({ ...prev, show: false })), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 p-6 md:p-8 transition-colors duration-300">
      {/* Toast Notification */}
      {showToast.show && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in duration-300">
          <Toast>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${showToast.type === 'success' ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'}`}>
              {showToast.type === 'success' ? <HiCheck className="h-5 w-5" /> : <HiExclamation className="h-5 w-5" />}
            </div>
            <div className="ml-3 text-sm font-normal">{showToast.message}</div>
            <Toast.Toggle onDismiss={() => setShowToast((prev) => ({ ...prev, show: false }))} />
          </Toast>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">🎯 Offer Management</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Create and manage your promotional offers.
            </p>
          </div>
          <Button
            type="button"
            onClick={addOffer}
            gradientDuoTone="greenToBlue"
            className="shadow-sm transition-transform hover:scale-105"
            aria-label="Add new offer"
            isProcessing={isSubmitting}
          >
            + Add Offer
          </Button>
        </div>

        {/* Offer Form */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-200">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Offer Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={newOffer.title}
                  onChange={handleInputChange}
                  placeholder="Summer Special"
                  className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  name="description"
                  value={newOffer.description}
                  onChange={handleInputChange}
                  placeholder="Get 20% off..."
                  className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <label className="flex items-center gap-2 text-sm mt-2">
                <input
                  type="checkbox"
                  name="active"
                  checked={newOffer.active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600"
                />
                Active
              </label>
            </div>
          </div>
        </div>

        {/* Offer Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
          {offers?.map((offer: any) => (
            <div
              key={offer.id}
              className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-md animate-in fade-in"
            >
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{offer.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{offer.description}</p>

                <label className="flex items-center gap-2 text-sm mt-2">
                  <input
                    type="checkbox"
                    checked={offer.active}
                    onChange={() => toggleOffer(offer.id)}
                    className="h-4 w-4 text-blue-600"
                  />
                  Active
                </label>

                <button
                  type="button"
                  onClick={() => deleteOffer(offer.id)}
                  className="text-red-500 hover:text-red-600 text-sm font-medium mt-3 transition"
                  aria-label={`Delete ${offer.title}`}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OffersPage;
