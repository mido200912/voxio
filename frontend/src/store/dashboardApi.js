import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { secureStorage } from '../utils/secureStorage';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BACKEND_URL,
    prepareHeaders: (headers) => {
      const token = secureStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Company', 'Integrations', 'Leads', 'Orders', 'Products', 'Conversations'],
  endpoints: (builder) => ({
    getCompany: builder.query({
      query: () => '/company',
      providesTags: ['Company'],
      keepUnusedDataFor: 300,
    }),
    getIntegrations: builder.query({
      query: () => '/integration-manager',
      providesTags: ['Integrations'],
      keepUnusedDataFor: 300,
    }),
    getLeads: builder.query({
      query: () => '/company/leads',
      providesTags: ['Leads'],
      keepUnusedDataFor: 300,
    }),
    getOrders: builder.query({
      query: () => '/company/requests',
      providesTags: ['Orders'],
      keepUnusedDataFor: 300,
    }),
    getProducts: builder.query({
      query: () => '/products',
      providesTags: ['Products'],
      keepUnusedDataFor: 300,
    }),
    getConversations: builder.query({
      query: () => '/handoff/conversations',
      providesTags: ['Conversations'],
      keepUnusedDataFor: 120,
    }),
  }),
});

export const {
  useGetCompanyQuery,
  useGetIntegrationsQuery,
  useGetLeadsQuery,
  useGetOrdersQuery,
  useGetProductsQuery,
  useGetConversationsQuery,
} = dashboardApi;
