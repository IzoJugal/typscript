/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link } from "react-router-dom";
import { apiUrl } from "../../environment/env";
import { ReactNode, useCallback, useEffect, useState } from "react";
import apiClient from "../../utils/AxiosInstance";
import { IoIosCall, IoIosMail } from "react-icons/io";
import { RiHomeOfficeFill } from "react-icons/ri";
import { ISocialMedia } from "../socialMedia/SocialMedia";
import { createQueryParams } from "../../utils/functions";
import { useConfigs } from "../../context/SiteConfigsProvider";


export interface ISiteConfig {
    _id: string
    siteName: string;
    subTitle: string;
    siteURL: string;
    copyright: string;
    year: number;
    metaDescription: string;
    metaKeywords: string;
    address: string;
    email: string;
    designBy: string;
    footerText: string;
    headerLogo: string;
    footerLogo: string;
    favicon: string;
    designByUrl?: string;
    playStoreUrl?: string;
    appleStoreUrl?: string;
    countryCode?: string;
    phoneNumber?: string;
}

interface ScrollToTopLinkProps {
    to: string;
    children: ReactNode;
}

const Footer = () => {
    const [socialMedia, setSocialMedia] = useState<ISocialMedia[]>([]);

  const { configData } = useConfigs();

    const getAllSocialMedia = useCallback(async () => {
        try {
            const combinedData = {
                isActive: "true"
            };
            const queryParams = createQueryParams(combinedData);
            const response = await apiClient.get(`/social-media${queryParams}`,);
            setTimeout(() => {
                setSocialMedia(response.data?.data);
            }, 500);
        } catch (error) {
            setSocialMedia([])
            console.error('~ getAllSocialMedia error :-', error);
        }
    }, []);

    useEffect(() => {
        getAllSocialMedia();
    }, [getAllSocialMedia]);

    let logo = `/FooterLogo.png`;
    if (configData?.footerLogo) {
        logo = `${apiUrl}/${configData?.footerLogo}`
    }


    // const imageOnError = (event: any, target: string) => {
    //     event.currentTarget.src = `/public/images/Image-not-found.png`;
    //     event.currentTarget.className = `${(target === 'logo') ? '"mb-5 h-[59px]' : 'flex w-[30px] h-[30px] bg-slate-50 rounded'}`;
    // };

    const fallbackSrc = '/images/Image-not-found.png';

    const imageOnError = (event: any, target: string) => {
        if (event.currentTarget.src.includes(fallbackSrc)) return;

        event.currentTarget.src = fallbackSrc;
        event.currentTarget.className = (target === 'logo')
            ? 'mb-5 h-[59px]'
            : 'flex w-[30px] h-[30px] bg-slate-50 rounded';
    };


    const ScrollToTopLink = ({ to, children }: ScrollToTopLinkProps) => {
        const handleClick = () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        return (
            <li className="mb-2 hover:text-BRAND-400">
                <Link to={to} onClick={handleClick}>
                    {children}
                </Link>
            </li>
        );
    };

    return (
        <footer id="footer-download" className="bg-slate-950 text-white bg-element">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex justify-center pt-3">
                    <div className="grid md:grid-cols-3 gap-7">
                        <div className="">
                            <Link to="">
                                <img src={logo} onError={(e: any) => imageOnError(e, "logo")} alt="pos_logo" className=" h-[100px]" loading="lazy" />
                            </Link>
                            <p className=" mb-5 text-justify">{configData?.footerText}. {configData?.metaDescription}</p>
                            {/* <p className="text-slate-100 mb-5 text-justify">{configData.metaDescription}</p> */}
                            {/* <ul className="text-zinc-400 flex gap-3">
                                {socialMedia.length > 0 && socialMedia.map((ele: any, i) => {
                                    return (
                                        <li key={i}>
                                            <Link to={ele?.url} target="_blank">
                                                <img
                                                    onError={(e: any) => imageOnError(e, "image")}
                                                    className="flex w-[30px] h-[30px] rounded"
                                                    src={`${apiUrl}/${ele.image}`}
                                                    alt="icon"
                                                    loading="lazy"
                                                />
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul> */}
                        </div>
                        <div className="md:flex md:flex-col w-[220px] md:m-[0_auto]">
                            <h3 className=" mb-6 text-xl font-bold text-white flex">
                                Useful Links
                            </h3>
                            <ul>
                                <ScrollToTopLink to="/aboutus">About Us</ScrollToTopLink>
                                <ScrollToTopLink to="/contactus">Contact Us</ScrollToTopLink>
                                <ScrollToTopLink to="/terms_conditions">Terms & Conditions</ScrollToTopLink>
                                <ScrollToTopLink to="/privacy_policy">Privacy & Policy</ScrollToTopLink>
                            </ul>
                        </div>
                        <div className="">
                            <h3 className="text-xl font-bold text-white mb-4">Get In Touch</h3>
                            {configData && <ul className="flex flex-col footerlink-text">
                                <li className=" flex mt-5 mb-2 items-center">
                                    <Link to="#" target="_blank" className="flex">
                                        <RiHomeOfficeFill className="mt-[-6px]" />
                                        <span className="ml-3 -mt-3 flex-1">
                                            {configData?.address}
                                        </span>
                                    </Link>
                                </li>
                                <li className="mt-2 mb-4">
                                    {/* <Link to="mailto:info@posbucket.com" className="flex">
                                        <IoIosMail className="mt-[2px]" />
                                        <span className="ml-3 -mt-1 flex-1">
                                            {configData?.email}
                                        </span>
                                    </Link> */}
                                    <a href={`mailto:${configData?.email}`} className="flex">
                                        <IoIosMail className="mt-[2px]" />
                                        <span className="ml-3 -mt-1 flex-1">
                                            {configData?.email}
                                        </span>
                                    </a>
                                </li>
                                {(configData?.phoneNumber && configData?.countryCode) && (
                                    <li className="mt-2 mb-4">
                                        <a href={`tel:${configData?.countryCode}${configData?.phoneNumber}`} className="flex">
                                            <IoIosCall className="mt-[2px]" />
                                            <span className="ml-3 -mt-1 flex-1">
                                                {configData?.countryCode} {configData?.phoneNumber}
                                            </span>
                                        </a>
                                    </li>
                                )}

                            </ul>}
                        </div>
                    </div>
                </div>
                <div className="flex justify-between gap-3 items-center mb-2">
                    {/* Social Media Icons */}
                    <ul className="text-zinc-400 flex gap-3">
                        {socialMedia?.length > 0 && socialMedia.map((ele: any, i) => {
                            return (
                                <li key={i}>
                                    <Link to={ele?.url} target="_blank">
                                        <img
                                            onError={(e: any) => imageOnError(e, "image")}
                                            className="w-[30px] h-[30px] rounded"
                                            src={`${apiUrl}/${ele.image}`}
                                            alt="icon"
                                            loading="lazy"
                                        />
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>

                    {/* App Download Buttons */}
                    <div className="flex gap-3">
                        {configData?.playStoreUrl && (<Link to={configData?.playStoreUrl || '/'} target="_blank">
                            <img src="/images/playStoreWhite.svg" alt="Google Play" className="h-[45px] object-contain" />
                        </Link>)}
                        {configData?.appleStoreUrl && (<Link to={configData?.appleStoreUrl || "/"} target="_blank">
                            <img src="/images/appStoreWhite.svg" alt="App Store" className="h-[45px] object-contain" />
                        </Link>)}
                    </div>
                </div>

            </div>
            <div className="border-t border-t-gray-700 bg-slate-950 py-6 text-center text-sm text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <p className="mb-2">
                        © {new Date().getFullYear()}{" "}
                        <span className="text-BRAND-500 font-medium">POS Bucket</span>
                    </p>
                    <p>
                        Designed and Developed by{" "}
                        <Link
                            to={configData?.designByUrl || '/'}
                            target="_blank"
                            className="text-BRAND-500 font-medium hover:underline"
                        >
                            {configData?.designBy}
                        </Link>
                    </p>
                </div>
            </div>

        </footer>
    )
}

export default Footer