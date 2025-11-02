 export const formatCurrency = (salary: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(salary);
    };
