import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";
import { apiUrl, siteUrl } from "../../environment/env";
import { HiPencil } from "react-icons/hi";
import { TbArrowBack } from "react-icons/tb";
import { formatDate } from "../../utils/utility";
import { useConfigs } from "../../context/SiteConfigsProvider";
import { SUPER_ADMIN } from "../../utils/common/constant";

const Profile = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const NoImage = `${siteUrl}/images/download.png`;
    const { configData } = useConfigs();
  const loginRole = userData?.staffMember?.role?.name;
  const isSuperAdmin = loginRole === SUPER_ADMIN;
  return (
    <div className="min-h-screen bg-DARK-50 dark:bg-DARK-900">
      {/* Header Gradient */}
      <div className="h-28 bg-gradient-to-t from-DARK-200 -via-BRAND-600 to-DARK-100 dark:from-DARK-900 dark:to-DARK-800 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden dark:bg-DARK-800 dark:shadow-xl">
          <div className="relative pt-16 pb-10">
            <div className="flex flex-col items-center">
              <div className="relative">
                <img
                  src={`${apiUrl}/${userData?.staffMember?.profile}`}
                  className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border-4 border-white shadow-xl object-cover transition-transform duration-300 hover:scale-105"
                  onError={(e) => (e.currentTarget.src = NoImage)}
                  alt="Profile"
                />
                <div className="absolute bottom-2 right-2 bg-green-500 rounded-full p-2 shadow-md">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="mt-6 text-center">
                <h1 className="text-3xl sm:text-4xl font-bold text-DARK-900 dark:text-white tracking-tight">
                  {userData?.staffMember?.name}
                </h1>
                <p className="text-lg sm:text-xl text-PRIMARY font-semibold mt-2">
                  {userData?.staffMember?.position}
                </p>
                <p className="text-sm sm:text-base text-DARK-500 dark:text-DARK-400 mt-1 font-semibold">{userData?.staffMember?.email}</p>
              </div>
              <div className="mt-8 flex justify-center gap-4">
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-2 px-6 py-3 bg-DARK-200 text-DARK-700 rounded-xl hover:bg-DARK-300 transition-all duration-200 font-semibold text-sm sm:text-base shadow-sm dark:bg-DARK-700 dark:text-white dark:hover:bg-DARK-600"
                >
                  <TbArrowBack className="text-lg" />
                  Back
                </button>
                <button
                  onClick={() => navigate(`/profile/edit/${userData?.staffMember?._id}`)}
                  className="flex items-center gap-2 px-6 py-3 bg-PRIMARY text-white rounded-xl hover:bg-PRIMARY_HOVER transition-all duration-200 font-semibold text-sm sm:text-base shadow-sm"
                >
                  <HiPencil className="text-lg" />
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div
          className={`mt-10 grid gap-8 ${isSuperAdmin
              ? "grid-cols-1"
              : "grid-cols-1 lg:grid-cols-3"
            }`}
        >
          {/* Main Info Card */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-lg p-8 dark:bg-DARK-800 dark:shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-semibold text-DARK-900 dark:text-white mb-8">Professional Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {userData?.staffMember?.name && (
                <div className="flex items-center py-4 border-b border-DARK-100 dark:border-DARK-700">
                  <span className="font-medium text-DARK-700 dark:text-DARK-300 w-32">Full Name:</span>
                  <span className="text-DARK-600 dark:text-DARK-400">{userData.staffMember.name}</span>
                </div>
              )}
              {userData?.staffMember?.email && (
                <div className="flex items-center py-4 border-b border-DARK-100 dark:border-DARK-700">
                  <span className="font-medium text-DARK-700 dark:text-DARK-300 w-32">Email:</span>
                  <span className="text-DARK-600 dark:text-DARK-400">{userData.staffMember.email}</span>
                </div>
              )}
              {userData?.staffMember?.phone && (
                <div className="flex items-center py-4 border-b border-DARK-100 dark:border-DARK-700">
                  <span className="font-medium text-DARK-700 dark:text-DARK-300 w-32">Mobile:</span>
                  <span className="text-DARK-600 dark:text-DARK-400">{userData.staffMember.phone}</span>
                </div>
              )}
              {userData?.staffMember?.position && (
                <div className="flex items-center py-4 border-b border-DARK-100 dark:border-DARK-700">
                  <span className="font-medium text-DARK-700 dark:text-DARK-300 w-32">Position:</span>
                  <span className="text-DARK-600 dark:text-DARK-400">{userData.staffMember.position}</span>
                </div>
              )}
              {userData?.staffMember?.hireDate && (
                <div className="flex items-center py-4 border-b border-DARK-100 dark:border-DARK-700">
                  <span className="font-medium text-DARK-700 dark:text-DARK-300 w-32">Hire Date:</span>
                  <span className="text-DARK-600 dark:text-DARK-400">{formatDate(userData.staffMember.hireDate,configData?.dateFormat)}</span>
                </div>
              )}
              {userData?.staffMember?.role?.name && (
                <div className="flex items-center py-4 border-b border-DARK-100 dark:border-DARK-700">
                  <span className="font-medium text-DARK-700 dark:text-DARK-300 w-32">Role:</span>
                  <span className="text-DARK-600 dark:text-DARK-400">{userData.staffMember.role.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Additional Info Card */}
          {!isSuperAdmin && (
            <div className="bg-white rounded-3xl shadow-lg p-8 dark:bg-DARK-800 dark:shadow-xl">
              <h2 className="text-2xl sm:text-3xl font-semibold text-DARK-900 dark:text-white mb-8">Organization</h2>
              <div className="space-y-6">
                {userData?.staffMember?.company?.name && (
                  <div className="flex items-center py-4 border-b border-DARK-100 dark:border-DARK-700">
                    <span className="font-medium text-DARK-700 dark:text-DARK-300 w-32">Business:</span>
                    <span className="text-DARK-600 dark:text-DARK-400">{userData.staffMember.company.name}</span>
                  </div>
                )}
                {userData?.staffMember?.restaurant?.name && (
                  <div className="flex items-center py-4 border-b border-DARK-100 dark:border-DARK-700">
                    <span className="font-medium text-DARK-700 dark:text-DARK-300 w-32">Restaurant:</span>
                    <span className="text-DARK-600 dark:text-DARK-400">{userData.staffMember.restaurant.name}</span>
                  </div>
                )}
                {userData?.staffMember?.age != 0 && (
                  <div className="flex items-center py-4 border-b border-DARK-100 dark:border-DARK-700">
                    <span className="font-medium text-DARK-700 dark:text-DARK-300 w-32">Age:</span>
                    <span className="text-DARK-600 dark:text-DARK-400">{userData.staffMember.age}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

};

export default Profile;