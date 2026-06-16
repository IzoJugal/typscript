import { Modal } from 'flowbite-react';
import { useState } from 'react';
import { capitalized } from '../../utils/utility';
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { FiCheckCircle } from 'react-icons/fi';
import { usePOS } from '../../context/POSProvider';

const QuestionModal = ({ openQuestion, closeQuestions, selectedProduct, addToCart, selectedModifiers, setSelectedModifiers }: any) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const selectedQuestions = selectedProduct?.questions;
    const { currency } = usePOS();

    const handleNext = () => {
        if (currentIndex < selectedQuestions?.length - 1) {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentIndex(currentIndex + 1);
                setIsTransitioning(false);
            }, 300);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentIndex(currentIndex - 1);
                setIsTransitioning(false);
            }, 300);
        }
    };

    const currentQuestion = selectedQuestions[currentIndex];
    const progress = ((currentIndex + 1) / selectedQuestions?.length) * 100;

    return (
        <Modal
            show={openQuestion}
            onClose={closeQuestions}
            className="backdrop-blur-lg bg-black/40 dark:bg-black/60 font-sans transition-all duration-500"
            popup
            aria-labelledby="modal-title"
        >
            <Modal.Header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 rounded-t-xl p-4">
                <h2 id="modal-title" className="text-lg font-semibold text-gray-900 dark:text-white text-center w-full">
                    Customize Your {capitalized(selectedProduct?.name)}
                </h2>
            </Modal.Header>
            <Modal.Body className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md p-6 rounded-b-xl">
                <div className="space-y-6">
                    {/* Radial Progress Indicator */}
                    <div className="flex justify-center items-center mb-4">
                        <div className="relative w-16 h-16">
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                                <circle
                                    className="text-gray-200 dark:text-gray-700 stroke-current"
                                    strokeWidth="8"
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    fill="transparent"
                                />
                                <circle
                                    className="text-BRAND-500 stroke-current"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    fill="transparent"
                                    strokeDasharray="283"
                                    strokeDashoffset={283 - (283 * progress) / 100}
                                    style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                                />
                            </svg>
                            <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-sm font-medium text-gray-700 dark:text-gray-200">
                                {currentIndex + 1}/{selectedQuestions?.length}
                            </span>
                        </div>
                    </div>

                    {/* Question Title */}
                    <h3
                        className={`text-2xl font-bold text-gray-800 dark:text-gray-100 text-center transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'
                            }`}
                    >
                        {currentQuestion?.question}
                    </h3>

                    {/* Answers Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 px-4 py-6">
                        {currentQuestion?.answers?.map((answer: any) => {
                            const isSelected =
                                selectedModifiers[selectedProduct._id] &&
                                Array.from(selectedModifiers[selectedProduct._id]).some(
                                    (item: any) => item._id === answer._id
                                );

                            return (
                                <button
                                    key={answer._id}
                                    onClick={() => {
                                        setSelectedModifiers((prev: any) => {
                                            const productId = selectedProduct._id;
                                            const updated = { ...prev };

                                            if (!updated[productId]) {
                                                updated[productId] = new Set();
                                            }

                                            const currentSet = new Set(updated[productId]);
                                            const exists = Array.from(currentSet).some(
                                                (item: any) => item._id === answer._id
                                            );

                                            if (exists) {
                                                updated[productId] = new Set(
                                                    Array.from(currentSet).filter(
                                                        (item: any) => item._id !== answer._id
                                                    )
                                                );
                                            } else {
                                                currentSet.add({
                                                    _id: answer._id,
                                                    name: answer.name,
                                                    price: answer.price,
                                                });
                                                updated[productId] = currentSet;
                                            }

                                            return { ...updated };
                                        });
                                    }}
                                    className={`relative rounded-xl p-4 transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-BRAND-400 focus:ring-offset-2 ${isSelected
                                        ? 'bg-BRAND-50 dark:bg-BRAND-800/30 border-2 border-BRAND-500 dark:border-BRAND-400 shadow-lg'
                                        : 'bg-white/80 dark:bg-gray-800/80 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200/50 dark:border-gray-700/50 shadow-sm'
                                        }`}
                                    style={{
                                        boxShadow: isSelected
                                            ? 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)'
                                            : 'inset 0 1px 2px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.03)',
                                    }}
                                    aria-pressed={isSelected}
                                    aria-label={`Select ${answer.name}`}
                                >
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 text-center">
                                        {capitalized(answer.name)}
                                    </p>
                                    <span className='text-xs text-slate-700 dark:text-slate-300 font-semibold'>{answer.price ? `${currency?.symbol || "$"}${answer.price}` : 'Free'}</span>
                                    {isSelected && (
                                        <FiCheckCircle className="absolute top-2 right-2 w-4 h-4 text-BRAND-500 animate-pulse" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between items-center pt-6">
                        <button
                            onClick={handlePrev}
                            disabled={currentIndex === 0}
                            className="flex items-center px-5 py-2.5 rounded-xl bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm"
                            style={{ boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' }}
                            aria-label="Previous question"
                        >
                            <FaChevronLeft className="w-4 h-4 mr-1" />
                            Back
                        </button>
                        <button
                            onClick={
                                selectedQuestions?.length === currentIndex + 1
                                    ? () => {
                                        setIsTransitioning(true);
                                        setTimeout(() => {
                                            closeQuestions();
                                            addToCart(selectedProduct);
                                            setIsTransitioning(false);
                                        }, 300);
                                    }
                                    : handleNext
                            }
                            disabled={
                                currentIndex === selectedQuestions?.length - 1 &&
                                selectedQuestions?.length !== currentIndex + 1
                            }
                            className="flex items-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-BRAND-500 to-BRAND-600 text-white hover:from-BRAND-600 hover:to-BRAND-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-BRAND-400 shadow-md"
                            style={{ boxShadow: '0 3px 6px rgba(0, 0, 0, 0.1)' }}
                            aria-label={
                                selectedQuestions?.length === currentIndex + 1
                                    ? 'Finish and add to cart'
                                    : 'Next question'
                            }
                        >
                            {selectedQuestions?.length === currentIndex + 1 ? 'Add to Cart' : 'Next'}
                            <FaChevronRight className="w-4 h-4 ml-1" />
                        </button>
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default QuestionModal;