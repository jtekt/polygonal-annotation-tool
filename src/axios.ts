import axios from 'axios'

axios.defaults.baseURL = import.meta.env.VITE_STORAGE_SERVICE_API_URL

export default axios
