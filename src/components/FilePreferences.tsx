import React, { useState } from 'react';
import { Settings, X } from 'lucide-react';

type NamingConvention = 'camelCase' | 'kebab-case' | 'snake_case' | 'PascalCase';

interface FilePreferencesProps {
  onClose: () => void;
  onSave: (preferences: { namingConvention: NamingConvention }) => void;
  initialConvention?: NamingConvention;
}

const getCurrentDate = () => {
  const date = new Date();
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
};

const examples: Record<NamingConvention, { pattern: string; example: string }> = {
  camelCase: {
    pattern: '[Date]_[Title]_[Project]',
    example: `${getCurrentDate()}_marketingPresentation_q1Launch`
  },
  'kebab-case': {
    pattern: '[Date]_[Title]_[Project]',
    example: `${getCurrentDate()}_marketing-presentation_q1-launch`
  },
  snake_case: {
    pattern: '[Date]_[Title]_[Project]',
    example: `${getCurrentDate()}_marketing_presentation_q1_launch`
  },
  PascalCase: {
    pattern: '[Date]_[Title]_[Project]',
    example: `${getCurrentDate()}_MarketingPresentation_Q1Launch`
  }
};

export function FilePreferences({ onClose, onSave, initialConvention = 'camelCase' }: FilePreferencesProps) {
  const [selectedConvention, setSelectedConvention] = useState<NamingConvention>(initialConvention);

  const handleSave = () => {
    onSave({ namingConvention: selectedConvention });
    onClose();
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-6 w-full max-w-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Settings className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">File Naming Preferences</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Choose naming convention
          </label>
          <p className="text-sm text-gray-500 mb-4">
            Pattern: <code className="bg-gray-100 px-2 py-1 rounded">[Date]_[Title]_[Project]</code>
          </p>
          <div className="space-y-3">
            {Object.entries(examples).map(([convention, { pattern, example }]) => (
              <label
                key={convention}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  selectedConvention === convention
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } cursor-pointer transition-colors`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="naming-convention"
                    value={convention}
                    checked={selectedConvention === convention}
                    onChange={(e) => setSelectedConvention(e.target.value as NamingConvention)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="space-y-1">
                    <p className="font-medium text-gray-900">{convention}</p>
                    <div className="text-sm">
                      <p className="text-gray-500">Example:</p>
                      <code className="block bg-gray-100 px-2 py-1 rounded mt-1 text-blue-600 font-mono text-xs">
                        {example}
                      </code>
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}