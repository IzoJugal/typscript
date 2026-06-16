import { Link } from "react-router-dom"
interface FormHeaderPathsProps {
    page: string;
    prevLink: string;
    prevPage: string;
}

interface DetailHeaderPathsProps {
    label: string; // Label for the header, e.g., "Product Details"
  }

export function FormHeaderPaths({ page, prevLink, prevPage }: Readonly<FormHeaderPathsProps>) {
    return (
        <div className="px-4 sm:px-6 lg:px-8 flex hide-on-print">
        {/* <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex hide-on-print"> */}
            <div className="items-end justify-between space-y-4 sm:flex sm:space-y-0 mb-2">
                <div>
                    <nav className="flex justify-between">
                        <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                            <li className="inline-flex items-center">
                                <Link to="/" className="inline-flex items-center text-sm font-medium text-DARK-700 hover:text-primary-600 dark:text-DARK-400 dark:hover:text-white">
                                    <svg className="me-2.5 h-3 w-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
                                    </svg>
                                    Dashboard
                                </Link>
                            </li>
                            <li>
                                <div className="flex items-center">
                                    <svg className="h-5 w-5 text-DARK-400 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill="none" viewBox="0 0 24 24">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m9 5 7 7-7 7" />
                                    </svg>
                                    <Link to={prevLink} className="ms-1 text-sm font-medium text-DARK-700 hover:text-primary-600 dark:text-DARK-400 dark:hover:text-white md:ms-2">{prevPage}</Link>
                                </div>
                            </li>
                            <li>
                                <div className="flex items-center">
                                    <svg className="h-5 w-5 text-DARK-400 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill="none" viewBox="0 0 24 24">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m9 5 7 7-7 7" />
                                    </svg>
                                    <div className="ms-1 text-sm font-medium text-BRAND-500 hover:text-primary-600 dark:text-DARK-400 dark:hover:text-white md:ms-2">{page}</div>
                                </div>
                            </li>
                        </ol>
                    </nav>
                </div>
            </div>
        </div>
    )
}

export function DetailHeaderPaths({ label }: Readonly<DetailHeaderPathsProps>) {
    return (
            <div className="mb-2 items-end justify-between space-y-2 sm:flex sm:space-y-0 md:mb-4">
                <div>
                    <nav className="flex justify-between">
                        <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                            <li className="inline-flex items-center">
                                <Link to="/" className="inline-flex items-center text-sm font-medium text-DARK-700 hover:text-primary-600 dark:text-DARK-400 dark:hover:text-white">
                                    <svg className="me-2.5 h-3 w-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
                                    </svg>
                                    Dashboard
                                </Link>
                            </li>
                            <li>
                                <div className="flex items-center">
                                    <svg className="h-5 w-5 text-DARK-400 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill="none" viewBox="0 0 24 24">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m9 5 7 7-7 7" />
                                    </svg>
                                    <div className="ms-1 text-sm font-medium text-BRAND-500 hover:text-primary-600 dark:text-DARK-400 dark:hover:text-white md:ms-2">{label}</div>
                                </div>
                            </li>
                        </ol>
                    </nav>
                </div>

            </div>
    )
}
