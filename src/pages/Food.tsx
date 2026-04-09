import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Clock, Users, ChefHat, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Link } from "react-router-dom";
import BackButton from "@/components/BackButton";

const Food = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const cookingTips = [
    {
      id: 1,
      dish: "Margherita Pizza",
      tip: "Bake on a preheated tray or stone for a crisp base and bubbly cheese.",
      ingredients: ["Pizza dough", "Tomato sauce", "Fresh mozzarella", "Basil", "Olive oil", "Salt"],
    },
    {
      id: 2,
      dish: "Veggie Wrap Tacos",
      tip: "Roast vegetables first to deepen flavor before assembling wraps.",
      ingredients: ["Tortillas", "Bell peppers", "Onion", "Corn", "Lettuce", "Yogurt sauce", "Lime"],
    },
    {
      id: 3,
      dish: "Chicken Curry",
      tip: "Brown onions well before adding spices to build a rich curry base.",
      ingredients: ["Chicken", "Onion", "Tomato", "Garlic", "Ginger", "Turmeric", "Coriander powder", "Oil"],
    },
    {
      id: 4,
      dish: "Salmon Teriyaki",
      tip: "Pat salmon dry before searing so it caramelizes instead of steaming.",
      ingredients: ["Salmon fillet", "Soy sauce", "Honey", "Garlic", "Ginger", "Sesame seeds"],
    },
    {
      id: 5,
      dish: "Caesar Salad",
      tip: "Chill bowls and lettuce so dressing coats leaves without wilting them.",
      ingredients: ["Romaine lettuce", "Croutons", "Parmesan", "Lemon juice", "Olive oil", "Garlic", "Black pepper"],
    },
    {
      id: 6,
      dish: "Chocolate Cake",
      tip: "Use room-temperature eggs and milk for smoother batter and even rise.",
      ingredients: ["Flour", "Cocoa powder", "Sugar", "Eggs", "Milk", "Baking powder", "Butter"],
    },
    {
      id: 7,
      dish: "Paneer Butter Masala",
      tip: "Blend the gravy and simmer before adding paneer for a creamy texture.",
      ingredients: ["Paneer", "Tomato", "Onion", "Butter", "Cream", "Garam masala", "Cashews"],
    },
    {
      id: 8,
      dish: "Mushroom Risotto",
      tip: "Add warm stock gradually and stir often to release starch naturally.",
      ingredients: ["Arborio rice", "Mushrooms", "Onion", "Garlic", "Vegetable stock", "Parmesan", "Butter"],
    },
    {
      id: 9,
      dish: "Greek Salad",
      tip: "Season vegetables lightly first, then add feta and dressing at the end.",
      ingredients: ["Cucumber", "Tomatoes", "Onion", "Olives", "Feta", "Olive oil", "Oregano"],
    },
    {
      id: 10,
      dish: "Vegetable Fried Rice",
      tip: "Use cold cooked rice so grains stay separate and don't turn mushy.",
      ingredients: ["Cooked rice", "Carrot", "Beans", "Capsicum", "Soy sauce", "Spring onion", "Oil"],
    },
  ];

  const recipes = [
    { id: 1, title: "Classic Margherita Pizza", image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600", time: "30 min", servings: 4, difficulty: "Easy", category: "Italian" },
    { id: 2, title: "Veggie Wrap Tacos", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600", time: "20 min", servings: 4, difficulty: "Easy", category: "Mexican" },
    { id: 3, title: "Chicken Curry", image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600", time: "45 min", servings: 6, difficulty: "Medium", category: "Indian" },
    { id: 4, title: "Salmon Teriyaki", image: "https://images.unsplash.com/photo-1580959375944-1ab5dac6c2c0?w=600", time: "25 min", servings: 2, difficulty: "Medium", category: "Japanese" },
    { id: 5, title: "Caesar Salad", image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600", time: "15 min", servings: 4, difficulty: "Easy", category: "Salad" },
    { id: 6, title: "Chocolate Cake", image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600", time: "60 min", servings: 8, difficulty: "Hard", category: "Dessert" },
    { id: 7, title: "Paneer Butter Masala", image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600", time: "35 min", servings: 4, difficulty: "Medium", category: "Indian" },
    { id: 8, title: "Mushroom Risotto", image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600", time: "40 min", servings: 3, difficulty: "Medium", category: "Italian" },
    { id: 9, title: "Avocado Toast Deluxe", image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600", time: "10 min", servings: 2, difficulty: "Easy", category: "Breakfast" },
    { id: 10, title: "Mediterranean Bowl", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600", time: "20 min", servings: 2, difficulty: "Easy", category: "Healthy" },
    { id: 11, title: "Thai Green Curry", image: "https://images.unsplash.com/photo-1569562211093-4ed0d0758f12?w=600", time: "30 min", servings: 4, difficulty: "Medium", category: "Thai" },
    { id: 12, title: "Falafel Wrap", image: "https://images.unsplash.com/photo-1625944230923-6f7f50f6e8f7?w=600", time: "25 min", servings: 3, difficulty: "Easy", category: "Middle Eastern" },
    { id: 13, title: "Pesto Pasta", image: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=600", time: "18 min", servings: 3, difficulty: "Easy", category: "Italian" },
    { id: 14, title: "Sushi Veg Roll", image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600", time: "35 min", servings: 2, difficulty: "Medium", category: "Japanese" },
    { id: 15, title: "Greek Salad", image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600", time: "12 min", servings: 2, difficulty: "Easy", category: "Salad" },
    { id: 16, title: "Lentil Soup", image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600", time: "30 min", servings: 5, difficulty: "Easy", category: "Soup" },
    { id: 17, title: "Berry Smoothie Bowl", image: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=600", time: "8 min", servings: 1, difficulty: "Easy", category: "Breakfast" },
    { id: 18, title: "Vegetable Fried Rice", image: "https://images.unsplash.com/photo-1512058564366-c9e3e0460e2c?w=600", time: "20 min", servings: 3, difficulty: "Easy", category: "Asian" },
    { id: 19, title: "Tofu Stir Fry", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600", time: "22 min", servings: 3, difficulty: "Easy", category: "Asian" },
    { id: 20, title: "Banana Pancakes", image: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=600", time: "16 min", servings: 3, difficulty: "Easy", category: "Breakfast" },
    { id: 21, title: "Veggie Burrito Bowl", image: "https://images.unsplash.com/photo-1511690078903-71dc5a49f5e3?w=600", time: "18 min", servings: 2, difficulty: "Easy", category: "Mexican" },
    { id: 22, title: "Chickpea Curry", image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600", time: "28 min", servings: 4, difficulty: "Easy", category: "Indian" },
    { id: 23, title: "Fruit Yogurt Parfait", image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600", time: "9 min", servings: 2, difficulty: "Easy", category: "Dessert" },
    { id: 24, title: "Tomato Basil Bruschetta", image: "https://images.unsplash.com/photo-1572441710534-680a7adf6f68?w=600", time: "14 min", servings: 4, difficulty: "Easy", category: "Italian" }
  ];

  const filteredRecipes = recipes.filter(recipe =>
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-[400px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-secondary/80" />
        <img 
          src="https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=1200"
          alt="Food Hero"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
        />
        <div className="relative container h-full flex flex-col justify-center text-white">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Food & Recipes
          </h1>
          <p className="text-xl md:text-2xl max-w-2xl">
            Discover delicious recipes, cooking tips, and food news from around the world
          </p>
        </div>
      </section>

      <div className="container py-12">
        <BackButton fallbackPath="/" />
        {/* Search Bar */}
        <div className="mb-12">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search recipes, cuisines, ingredients..."
              className="pl-12 h-14 text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className="mb-12">
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/news">
              <Button variant="outline" size="lg">
                Food News
              </Button>
            </Link>
            <Button variant="outline" size="lg" onClick={() => setSearchQuery("trending")}>Trending Recipes</Button>
            <Button variant="outline" size="lg" onClick={() => setSearchQuery("salad")}>Meal Plans</Button>
            <Button variant="outline" size="lg" onClick={() => setSearchQuery("easy")}>Cooking Tips</Button>
          </div>
        </div>

        {/* Recipes Grid */}
        <div>
          <h2 className="text-3xl font-bold mb-8">Popular Recipes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
              <Card key={recipe.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="w-full h-48 object-cover"
                />
                <CardContent className="p-6">
                  <Badge className="mb-3">{recipe.category}</Badge>
                  <h3 className="font-semibold text-xl mb-4">{recipe.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{recipe.time}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{recipe.servings}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ChefHat className="w-4 h-4" />
                      <span>{recipe.difficulty}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-6 pt-0">
                  <Link className="w-full" to={`/products?search=${encodeURIComponent(recipe.title.split(" ")[0])}`}>
                    <Button className="w-full">Buy Ingredients</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* Cooking Tips */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold mb-8">Cooking Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cookingTips.map((tipItem) => (
              <Card key={tipItem.id} className="h-full">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Badge className="mb-3">{tipItem.dish}</Badge>
                    <p className="text-sm text-muted-foreground">{tipItem.tip}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Ingredients</h3>
                    <div className="flex flex-wrap gap-2">
                      {tipItem.ingredients.map((ingredient) => (
                        <Badge key={ingredient} variant="secondary">
                          {ingredient}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Food;
