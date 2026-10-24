import React from 'react';
import { VerificationStatus } from '../../types/api';
import { CheckCircle2, ShieldAlert, Sparkles, HelpCircle, XCircle } from 'lucide-react';
import { getVerificationStatusStyle } from '../../utils/formatters';

interface VerificationBadgeProps {
  status: VerificationStatus | string;
  size?: 'sm' | 'md';
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({ status, size = 'md' }) => {
  const styles = getVerificationStatusStyle(status);

  const getIcon = () => {
    switch (status) {
      case 'Tests Passed':
      case 'Validated':
      case 'Fix Validated':
        return <CheckCircle2 className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />;
      case 'Partially Fixed':
        return <ShieldAlert className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />;
      case 'Defects Detected':
      case 'Tests Failed':
      case 'Validation Failed':
        return <XCircle className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />;
      case 'Suggested':
        return <Sparkles className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />;
      case 'Not Runtime Tested':
      case 'Not Verified':
      default:
        return <HelpCircle className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />;
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'Tests Passed':
        return 'Tests Passed';
      case 'Validated':
      case 'Fix Validated':
        return 'Fix Validated';
      case 'Partially Fixed':
        return 'Partially Fixed';
      case 'Defects Detected':
        return 'Defects Detected';
      case 'Tests Failed':
        return 'Tests Failed';
      case 'Validation Failed':
        return 'Validation Failed';
      case 'Suggested':
        return 'AI Suggested (Unverified)';
      case 'Not Runtime Tested':
        return 'Not Runtime Tested';
      case 'Not Verified':
      default:
        return 'Not Verified — Editor Modified';
    }
  };

  return (
    <span
      className={`inline-flex items-center space-x-1.5 font-mono font-medium rounded-full border transition-all ${
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
      } ${styles.bg}`}
      title={`Current fix verification status: ${status}. Note: AI suggestions must be verified with execution or tests.`}
    >
      {getIcon()}
      <span>{getLabel()}</span>
    </span>
  );
};
