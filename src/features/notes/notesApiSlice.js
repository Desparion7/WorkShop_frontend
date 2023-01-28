import { createSelector, createEntityAdapter } from '@reduxjs/toolkit';
import { apiSlice } from '../../app/api/apiSlice';

const notesAdapter = createEntityAdapter({
	sortComparer: (a, b) =>
		a.completed === b.completed ? 0 : a.completed ? 1 : -1,
});

// initialState = {ids: [], entities: {}}.
const initialState = notesAdapter.getInitialState({});

export const notesApiSlice = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		getNotes: builder.query({
			query: () => '/notes',
			validateStatus: (response, result) => {
				return (response.status = 200 && !result.isError);
			},
			transformResponse: (responseData) => {
				const loadedNotes = responseData.map((note) => {
					note.id = note._id;
					return note;
				});
				return notesAdapter.setAll(initialState, loadedNotes);
			},
			providesTags: (result, error, arg) => {
				if (result?.ids) {
					return [
						{ type: 'Note', id: 'LIST' },
						...result.ids.map((id) => ({ type: 'Note', id })),
					];
				} else return [{ type: 'Note', id: 'LIST' }];
			},
		}),
		addNewNote: builder.mutation({
			query: (initialNoteData) => ({
				url: '/notes',
				method: 'POST',
				body: {
					...initialNoteData,
				},
			}),
			invalidatesTags: [{ type: 'Note', id: 'LIST' }],
		}),
		updateNote: builder.mutation({
			query: (initialNoteData) => ({
				url: '/notes',
				method: 'PATCH',
				body: {
					...initialNoteData,
				},
			}),
			invalidatesTags: (result, error, arg) => [{ type: 'Note', id: arg.id }],
		}),
		deleteNote: builder.mutation({
			query: ({ id }) => ({
				url: '/notes',
				method: 'DELETE',
				body: { id },
			}),
			invalidatesTags: (result, error, arg) => [{ type: 'Note', id: arg.id }],
		}),
	}),
});
export const {
	useGetNotesQuery,
	useAddNewNoteMutation,
	useUpdateNoteMutation,
	useDeleteNoteMutation,
} = notesApiSlice;

// returns the query result object
export const selectNotesResult = notesApiSlice.endpoints.getNotes.select();

//create memoized selector
const selectNotesData = createSelector(
	selectNotesResult,
	(notesResult) => notesResult.data //normalized state object with ids & entities
);

//getSelectors creates these selectors and we rename them with aliases using
export const {
	selectAll: selectAllNotes,
	selectById: selectNoteById,
	selectIds: selectNoteIds,
	// pass in selector that returns the notes slice of state
} = notesAdapter.getSelectors(
	(state) => selectNotesData(state) ?? initialState
);
