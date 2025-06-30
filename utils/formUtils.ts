
let idCounter = 0;

export const generateUniqueId = (prefix: string = 'form'): string => {
    idCounter++;
    return `${prefix}-${Date.now()}-${idCounter}`;
};

export const useUniqueId = (prefix: string = 'form'): string => {
    const [id] = React.useState(() => generateUniqueId(prefix));
    return id;
};
