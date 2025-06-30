
import React from 'react';
import type { CompanyProfile } from '../types.ts';

interface CompanyProfileProps {
    profile: CompanyProfile;
    theme: 'light' | 'dark';
}

export const CompanyProfileComponent: React.FC<CompanyProfileProps> = ({ profile, theme }) => {
    const formatMarketCap = (marketCap: number): string => {
        if (marketCap >= 1e12) {
            return `$${(marketCap / 1e12).toFixed(2)}T`;
        } else if (marketCap >= 1e9) {
            return `$${(marketCap / 1e9).toFixed(2)}B`;
        } else if (marketCap >= 1e6) {
            return `$${(marketCap / 1e6).toFixed(2)}M`;
        } else {
            return `$${marketCap.toLocaleString()}`;
        }
    };

    const formatEmployees = (employees: number): string => {
        if (employees >= 1000) {
            return `${(employees / 1000).toFixed(1)}K`;
        }
        return employees.toLocaleString();
    };

    return (
        <div className="bg-white/5 dark:bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10 dark:border-white/20">
            {/* Header with Company Logo and Name */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                <div className="flex-shrink-0">
                    <img 
                        src={profile.image} 
                        alt={`${profile.companyName} logo`}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-white/10 dark:bg-white/20 object-contain p-2"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iOCIgZmlsbD0iIzM3NDE1MSIvPgo8cGF0aCBkPSJNMjAgMjBINDRWNDRIMjBWMjBaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K';
                        }}
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 truncate">
                        {profile.companyName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                            {profile.exchange}
                        </span>
                        {profile.sector && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                {profile.sector}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 dark:from-blue-400/10 dark:to-blue-500/10 rounded-lg p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Market Cap</div>
                    <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                        {profile.marketCap > 0 ? formatMarketCap(profile.marketCap) : 'N/A'}
                    </div>
                </div>
                <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 dark:from-green-400/10 dark:to-green-500/10 rounded-lg p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-green-600 dark:text-green-400 font-medium mb-1">Employees</div>
                    <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                        {profile.employees > 0 ? formatEmployees(profile.employees) : 'N/A'}
                    </div>
                </div>
                <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 dark:from-purple-400/10 dark:to-purple-500/10 rounded-lg p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">Industry</div>
                    <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
                        {profile.industry || 'N/A'}
                    </div>
                </div>
                <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/10 dark:from-amber-400/10 dark:to-amber-500/10 rounded-lg p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-amber-600 dark:text-amber-400 font-medium mb-1">IPO Date</div>
                    <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                        {profile.ipoDate ? new Date(profile.ipoDate).getFullYear() : 'N/A'}
                    </div>
                </div>
            </div>

            {/* Company Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Left Column - Executive & Contact */}
                <div className="space-y-4">
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                            <img src="https://cdn.hugeicons.com/icons/user-stroke-rounded.svg" className="w-4 h-4" alt="CEO" />
                            Chief Executive Officer
                        </h4>
                        <p className="text-gray-900 dark:text-white font-medium">
                            {profile.ceo || 'Information not available'}
                        </p>
                    </div>

                    {profile.website && (
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                <img src="https://cdn.hugeicons.com/icons/link-01-stroke-rounded.svg" className="w-4 h-4" alt="Website" />
                                Website
                            </h4>
                            <a 
                                href={profile.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors underline break-all"
                            >
                                {profile.website}
                            </a>
                        </div>
                    )}

                    {profile.phone && (
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                <img src="https://cdn.hugeicons.com/icons/call-stroke-rounded.svg" className="w-4 h-4" alt="Phone" />
                                Phone
                            </h4>
                            <p className="text-gray-900 dark:text-white font-medium">
                                {profile.phone}
                            </p>
                        </div>
                    )}
                </div>

                {/* Right Column - Address */}
                <div>
                    {(profile.address || profile.city || profile.state) && (
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                <img src="https://cdn.hugeicons.com/icons/location-01-stroke-rounded.svg" className="w-4 h-4" alt="Address" />
                                Headquarters
                            </h4>
                            <div className="text-gray-900 dark:text-white space-y-1">
                                {profile.address && (
                                    <p className="font-medium">{profile.address}</p>
                                )}
                                <p className="font-medium">
                                    {[profile.city, profile.state, profile.zip].filter(Boolean).join(', ')}
                                </p>
                                {profile.country && (
                                    <p className="font-medium">{profile.country}</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Company Description */}
            {profile.description && (
                <div className="mt-6 pt-6 border-t border-white/10 dark:border-white/20">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <img src="https://cdn.hugeicons.com/icons/file-document-stroke-rounded.svg" className="w-4 h-4" alt="Description" />
                        Company Overview
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base leading-relaxed">
                        {profile.description}
                    </p>
                </div>
            )}
        </div>
    );
};
