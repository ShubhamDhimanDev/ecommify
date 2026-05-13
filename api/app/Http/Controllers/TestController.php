<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;

class TestController extends Controller
{

    private const PRODUCT_RELATIONS = [
        'category:id,name,slug',
        'tags:id,product_id,tag_name',
        'images:id,product_id,image_url,media_type,storage_path,alt_text,sort_order,file_size,mime_type,disk',
        'variants:id,product_id,name,sku,price,stock',
    ];

    public function index(string $id){
        $product = Product::query()->with(self::PRODUCT_RELATIONS)->findOrFail($id);
        return response()->json(['product' => $product]);
    }
}
