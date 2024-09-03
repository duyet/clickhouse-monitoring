import serverContext from "server-only-context";

export const [getHostId, setHostId] = serverContext("0");