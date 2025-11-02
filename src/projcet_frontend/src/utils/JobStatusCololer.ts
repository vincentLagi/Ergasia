export const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'green';
      case 'Ongoing': return 'orange';
      case 'Finished': return 'purple';
      case 'Cancelled': return 'red';
      default: return 'default';
    }
  };