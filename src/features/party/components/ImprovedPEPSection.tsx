// =================================================================================
// FILE: src/features/party/components/ImprovedPEPSection.tsx
// =================================================================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Info, ChevronDown, Search, X, CheckCircle, AlertTriangle } from 'lucide-react';

// Common countries for PEP exposure
const COMMON_PEP_COUNTRIES = [
  'Singapore',
  'Malaysia',
  'Thailand',
  'Indonesia',
  'Philippines',
  'Vietnam',
  'United States',
  'United Kingdom',
  'China',
  'Hong Kong',
  'Japan',
  'South Korea',
  'India',
  'Australia',
  'Canada',
  'Germany',
  'France',
  'Switzerland',
  'Netherlands',
  'UAE',
  'Saudi Arabia'
];

const ALL_COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia',
  'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium',
  'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil',
  'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada',
  'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros',
  'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti',
  'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea',
  'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon',
  'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea',
  'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hong Kong', 'Hungary', 'Iceland', 'India',
  'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan',
  'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon',
  'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar',
  'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania',
  'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro',
  'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands',
  'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway',
  'Oman', 'Pakistan', 'Palau', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines',
  'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis',
  'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Saudi Arabia',
  'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia',
  'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain',
  'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan',
  'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia',
  'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'UAE', 'United Kingdom',
  'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam',
  'Yemen', 'Zambia', 'Zimbabwe'
];

const CountrySelector = ({ 
  value, 
  onChange, 
  onClose 
}: { 
  value: string; 
  onChange: (country: string) => void; 
  onClose: () => void; 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllCountries, setShowAllCountries] = useState(false);

  const filteredCountries = (showAllCountries ? ALL_COUNTRIES : COMMON_PEP_COUNTRIES)
    .filter(country => 
      country.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort();

  const handleSelectCountry = (country: string) => {
    onChange(country);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg z-50 max-h-80 flex flex-col"
    >
      {/* Search Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search countries..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            autoFocus
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <button
            type="button"
            onClick={() => setShowAllCountries(!showAllCountries)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            {showAllCountries ? 'Show common countries' : 'Show all countries'}
          </button>
          <span className="text-xs text-slate-500">
            {filteredCountries.length} countries
          </span>
        </div>
      </div>

      {/* Country List */}
      <div className="flex-1 overflow-y-auto">
        {filteredCountries.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-sm">
            No countries found matching {searchTerm}
          </div>
        ) : (
          <div className="py-1">
            {filteredCountries.map((country) => (
              <button
                key={country}
                type="button"
                onClick={() => handleSelectCountry(country)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors ${
                  value === country ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {country}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

interface ImprovedPEPSectionProps {
  isPEP?: boolean;
  pepCountry: string;
  pepRemarks?: string;
  onPEPChange: (isPEP: boolean) => void;
  onPEPCountryChange: (country: string) => void;
  onPEPRemarksChange: (remarks: string) => void;
  isEditing?: boolean;
}

export function ImprovedPEPSection({
  isPEP = false,
  pepCountry,
  pepRemarks = '',
  onPEPChange,
  onPEPCountryChange,
  onPEPRemarksChange,
  isEditing = true
}: ImprovedPEPSectionProps) {
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  if (!isEditing) {
    // Read-only view
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-slate-500" />
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Politically Exposed Person (PEP) Status
          </h3>
        </div>
        
        <div className={`p-4 rounded-lg border-2 ${
          isPEP 
            ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' 
            : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              isPEP ? 'bg-red-100 dark:bg-red-900/50' : 'bg-green-100 dark:bg-green-900/50'
            }`}>
              {isPEP ? (
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              )}
            </div>
            <div className="flex-1">
              <p className={`font-medium ${
                isPEP ? 'text-red-800 dark:text-red-200' : 'text-green-800 dark:text-green-200'
              }`}>
                {isPEP ? 'Yes, this person is a PEP' : 'No, this person is not a PEP'}
              </p>
              <p className={`text-sm mt-0.5 ${
                isPEP ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
              }`}>
                {isPEP 
                  ? 'Enhanced due diligence required' 
                  : 'Standard due diligence applies'
                }
              </p>
              {isPEP && pepCountry && (
                <p className={`text-sm mt-1 ${
                  isPEP ? 'text-red-700 dark:text-red-300' : ''
                }`}>
                  Political exposure in: <span className="font-medium">{pepCountry}</span>
                </p>
              )}
            </div>
          </div>
          
          {/* 🔧 ADD: Read-only PEP remarks display */}
          {isPEP && pepRemarks && (
            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border-t border-slate-200 dark:border-slate-700">
              <h4 className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                PEP Remarks & Justification:
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {pepRemarks}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-slate-500" />
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Politically Exposed Person (PEP)
          </h3>
        </div>
        
        <button
          type="button"
          onClick={() => setShowInfo(!showInfo)}
          className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="What is a PEP?"
        >
          <Info className="h-4 w-4 text-slate-400" />
        </button>
      </div>

      {/* Information Panel */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
          >
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              What is a Politically Exposed Person (PEP)?
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
              A PEP is someone who holds or has held a prominent public position, such as heads of state, 
              government officials, senior executives of state-owned enterprises, or their immediate family 
              members and close associates. PEPs require enhanced due diligence due to higher corruption risks.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PEP Status Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
          Is this person a Politically Exposed Person (PEP)?
        </label>
        
        <div className="grid grid-cols-2 gap-3">
          <label className={`
            relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200
            ${!isPEP 
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
              : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
            }
          `}>
            <input
              type="radio"
              name="pepStatus"
              value="false"
              checked={!isPEP}
              onChange={() => onPEPChange(false)}
              className="sr-only"
            />
            <div className="flex items-center gap-3 w-full">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                !isPEP 
                  ? 'border-green-500 bg-green-500' 
                  : 'border-slate-300 dark:border-slate-500'
              }`}>
                {!isPEP && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 bg-white rounded-full"
                  />
                )}
              </div>
              <div className="flex-1">
                <span className={`text-sm font-medium ${
                  !isPEP ? 'text-green-800 dark:text-green-200' : 'text-slate-700 dark:text-slate-300'
                }`}>
                  No, not a PEP
                </span>
                <p className={`text-xs mt-0.5 ${
                  !isPEP ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  Standard due diligence required
                </p>
              </div>
            </div>
          </label>

          <label className={`
            relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200
            ${isPEP 
              ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
              : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
            }
          `}>
            <input
              type="radio"
              name="pepStatus"
              value="true"
              checked={isPEP}
              onChange={() => onPEPChange(true)}
              className="sr-only"
            />
            <div className="flex items-center gap-3 w-full">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                isPEP 
                  ? 'border-red-500 bg-red-500' 
                  : 'border-slate-300 dark:border-slate-500'
              }`}>
                {isPEP && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 bg-white rounded-full"
                  />
                )}
              </div>
              <div className="flex-1">
                <span className={`text-sm font-medium ${
                  isPEP ? 'text-red-800 dark:text-red-200' : 'text-slate-700 dark:text-slate-300'
                }`}>
                  Yes, is a PEP
                </span>
                <p className={`text-xs mt-0.5 ${
                  isPEP ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  Enhanced due diligence required
                </p>
              </div>
            </div>
          </label>
        </div>

        {/* Country Selection */}
        <AnimatePresence>
          {isPEP && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pl-15 space-y-2"
            >
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Country of Political Exposure *
              </label>
              
              <div className="relative">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCountrySelector(!showCountrySelector)}
                    className={`w-full px-3 py-2 text-left border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      pepCountry ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={pepCountry ? '' : 'pr-8'}>{pepCountry || 'Select country of political exposure...'}</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${showCountrySelector ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                  
                  {/* Clear button positioned absolutely to avoid nesting */}
                  {pepCountry && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPEPCountryChange('');
                      }}
                      className="absolute right-8 top-1/2 transform -translate-y-1/2 p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors z-10"
                      title="Clear selection"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {showCountrySelector && (
                    <CountrySelector
                      value={pepCountry}
                      onChange={onPEPCountryChange}
                      onClose={() => setShowCountrySelector(false)}
                    />
                  )}
                </AnimatePresence>
              </div>
              
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Specify the country where this person holds or held political influence
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🔧 ADD: PEP Remarks Section */}
        <AnimatePresence>
          {isPEP && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pl-15 space-y-2"
            >
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                PEP Remarks & Justification
              </label>
              
              <textarea
                value={pepRemarks || ''}
                onChange={(e) => onPEPRemarksChange(e.target.value)}
                placeholder="Provide details about PEP status, source of information, risk assessment, or any relevant notes..."
                rows={4}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                disabled={!isEditing}
              />
              
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Document the reason for PEP classification, source verification, and any risk mitigation measures
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Click outside handler */}
      {showCountrySelector && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowCountrySelector(false)}
        />
      )}
    </div>
  );
}