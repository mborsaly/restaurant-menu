import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useMenu(restaurantId) {
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!restaurantId) return

    async function loadMenu() {
      try {
        // Load categories
        const { data: cats } = await supabase
          .from('categories')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .eq('active', true)
          .order('sort_order')

        // Load all available items
        const { data: menuItems } = await supabase
          .from('menu_items')
          .select('*, item_options(*)')
          .eq('restaurant_id', restaurantId)
          .eq('available', true)
          .order('sort_order')

        setCategories(cats || [])
        setItems(menuItems || [])
      } catch (err) {
        console.error('Menu load error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadMenu()
  }, [restaurantId])

  // Get items filtered by category
  function getItemsByCategory(categoryId) {
    return items.filter(item => item.category_id === categoryId)
  }

  return { categories, items, loading, getItemsByCategory }
}

