import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export function useUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, email, name, avatar_url')
          .order('name')

        if (error) throw error

        if (mounted) {
          setUsers(data.map(user => ({
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar_url
          })))
          setLoading(false)
        }
      } catch (err) {
        console.error('Error fetching users:', err)
        if (mounted) {
          setError(err.message)
          setLoading(false)
        }
      }
    }

    // Subscribe to user changes
    const userSubscription = supabase
      .channel('users')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'users'
      }, (payload) => {
        if (!mounted) return

        // Update users list based on the change
        switch (payload.eventType) {
          case 'INSERT':
            setUsers(prev => [...prev, {
              id: payload.new.id,
              email: payload.new.email,
              name: payload.new.name,
              avatar: payload.new.avatar_url
            }])
            break
          case 'UPDATE':
            setUsers(prev => prev.map(user => 
              user.id === payload.new.id ? {
                id: payload.new.id,
                email: payload.new.email,
                name: payload.new.name,
                avatar: payload.new.avatar_url
              } : user
            ))
            break
          case 'DELETE':
            setUsers(prev => prev.filter(user => user.id !== payload.old.id))
            break
          default:
            break
        }
      })
      .subscribe()

    fetchUsers()

    return () => {
      mounted = false
      userSubscription.unsubscribe()
    }
  }, [])

  return { users, loading, error }
} 