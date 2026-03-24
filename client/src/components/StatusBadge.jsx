const statusConfig = {
  pending: { label: 'Pending', className: 'status-pending' },
  under_review: { label: 'Under Review', className: 'status-under_review' },
  accepted: { label: 'Accepted', className: 'status-accepted' },
  rejected: { label: 'Rejected', className: 'status-rejected' },
  revision_required: { label: 'Revision Required', className: 'status-revision_required' },
};

const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || { label: status, className: 'status-pending' };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${config.className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {config.label}
    </span>
  );
};

export default StatusBadge;
