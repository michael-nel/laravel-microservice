<?php

namespace App\Models;

use App\ModelFilters\GenreFilter;
use App\Models\Traits\SerializeDateToIso8601;
use Chelout\RelationshipEvents\Concerns\HasBelongsToManyEvents;
use EloquentFilter\Filterable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Genre extends Model
{
    use SoftDeletes, Traits\Uuid, Filterable, SerializeDateToIso8601, HasBelongsToManyEvents;
    protected $keyType = 'string';
    protected  $fillable = ['name','is_active'];

    protected $dates = ['deleted_at'];

    protected  $casts = [
        'id' => 'string', 'is_active' => 'boolean'
    ];

    protected  $observables = [
        'belongsToManyAttached'
    ];
    public $incrementing = false;

    public function categories(){
        return $this->belongsToMany(Category::class)->withTrashed();
    }

    public function modelFilter()
    {
        return $this->provideFilter(GenreFilter::class);
    }
}
