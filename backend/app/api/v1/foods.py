from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.models.food import Food, Serving
from app.models.food_log import FoodLog
from app.models.user import User

router = APIRouter(prefix="/foods", tags=["foods"])


class FoodResponse(BaseModel):
    id: str
    name: str
    brand: str
    source: str
    serving_label: str
    serving_grams: float
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float
    sugar_g: float
    sodium_mg: float
    saturated_fat_g: float


def _food_response(food: Food) -> FoodResponse:
    return FoodResponse(
        id=str(food.id),
        name=food.name,
        brand=food.brand,
        source=food.source,
        serving_label=food.serving.label,
        serving_grams=food.serving.grams,
        calories=food.calories,
        protein_g=food.protein_g,
        carbs_g=food.carbs_g,
        fat_g=food.fat_g,
        fiber_g=food.fiber_g,
        sugar_g=food.sugar_g,
        sodium_mg=food.sodium_mg,
        saturated_fat_g=food.saturated_fat_g,
    )


class FoodSearchResponse(BaseModel):
    results: list[FoodResponse]
    total: int


@router.get("/search", response_model=FoodSearchResponse)
async def search_foods(
    q: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    query = {"$text": {"$search": q}}
    total = await Food.find(query).count()
    foods = await Food.find(query).skip(offset).limit(limit).to_list()
    return FoodSearchResponse(
        results=[_food_response(f) for f in foods],
        total=total,
    )


class RecentFoodResponse(BaseModel):
    food_name: str
    food_id: str | None
    count: int
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float
    sugar_g: float
    sodium_mg: float
    saturated_fat_g: float
    serving_label: str


@router.get("/recent", response_model=list[RecentFoodResponse])
async def get_recent_foods(
    limit: int = Query(15, ge=1, le=30),
    user: User = Depends(get_current_user),
):
    """Get the user's most frequently logged foods."""
    pipeline = [
        {"$match": {"user_id": str(user.id)}},
        {"$sort": {"created_at": -1}},
        {"$group": {
            "_id": "$food_name",
            "food_id": {"$first": "$food_id"},
            "count": {"$sum": 1},
            "calories": {"$first": "$calories"},
            "protein_g": {"$first": "$protein_g"},
            "carbs_g": {"$first": "$carbs_g"},
            "fat_g": {"$first": "$fat_g"},
            "fiber_g": {"$first": "$fiber_g"},
            "sugar_g": {"$first": "$sugar_g"},
            "sodium_mg": {"$first": "$sodium_mg"},
            "saturated_fat_g": {"$first": "$saturated_fat_g"},
            "serving_label": {"$first": "$serving_label"},
            "quantity": {"$first": "$quantity"},
        }},
        {"$sort": {"count": -1}},
        {"$limit": limit},
    ]
    results = await FoodLog.aggregate(pipeline).to_list()
    return [
        RecentFoodResponse(
            food_name=r["_id"],
            food_id=r.get("food_id"),
            count=r["count"],
            calories=r["calories"],
            protein_g=r["protein_g"],
            carbs_g=r["carbs_g"],
            fat_g=r["fat_g"],
            fiber_g=r.get("fiber_g", 0),
            sugar_g=r.get("sugar_g", 0),
            sodium_mg=r.get("sodium_mg", 0),
            saturated_fat_g=r.get("saturated_fat_g", 0),
            serving_label=r["serving_label"],
        )
        for r in results
    ]


@router.get("/favorites", response_model=list[FoodResponse])
async def get_favorite_foods(
    user: User = Depends(get_current_user),
):
    """Get the user's favorite foods."""
    if not user.favorite_foods:
        return []
    foods = await Food.find({"_id": {"$in": [Food.id.parse(fid) for fid in user.favorite_foods]}}).to_list()
    return [_food_response(f) for f in foods]


class FavoriteToggleResponse(BaseModel):
    is_favorite: bool


@router.post("/{food_id}/favorite", response_model=FavoriteToggleResponse)
async def toggle_favorite_food(
    food_id: str,
    user: User = Depends(get_current_user),
):
    """Toggle a food as favorite."""
    food = await Food.get(food_id)
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")

    if food_id in user.favorite_foods:
        user.favorite_foods.remove(food_id)
        is_favorite = False
    else:
        user.favorite_foods.append(food_id)
        is_favorite = True

    await user.save()
    return FavoriteToggleResponse(is_favorite=is_favorite)


@router.get("/{food_id}", response_model=FoodResponse)
async def get_food(food_id: str):
    food = await Food.get(food_id)
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")
    return _food_response(food)


class CreateFoodRequest(BaseModel):
    name: str
    brand: str = ""
    serving_label: str = "100g"
    serving_grams: float = 100
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float = 0
    sugar_g: float = 0
    sodium_mg: float = 0
    saturated_fat_g: float = 0


@router.post("/", response_model=FoodResponse, status_code=201)
async def create_food(
    data: CreateFoodRequest,
    user: User = Depends(get_current_user),
):
    food = Food(
        name=data.name,
        brand=data.brand,
        source="custom",
        created_by=str(user.id),
        serving=Serving(label=data.serving_label, grams=data.serving_grams),
        calories=data.calories,
        protein_g=data.protein_g,
        carbs_g=data.carbs_g,
        fat_g=data.fat_g,
        fiber_g=data.fiber_g,
        sugar_g=data.sugar_g,
        sodium_mg=data.sodium_mg,
        saturated_fat_g=data.saturated_fat_g,
    )
    await food.insert()
    return _food_response(food)
