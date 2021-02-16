<?php

namespace App\Models;

use App\ModelFilters\CastMemberFilter;
use App\Model\Traits\Uuid;
use App\Models\Traits\SerializeDateToIso8601;
use EloquentFilter\Filterable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CastMember extends Model
{
    use SoftDeletes,Traits\Uuid, Filterable, SerializeDateToIso8601;

    const TYPE_DIRECTOR = 1;
    const TYPE_ACTOR = 2;

    public static $types = [
        CastMember::TYPE_DIRECTOR,
        CastMember::TYPE_ACTOR,
    ];

    protected $keyType = 'string';
    public $incrementing = false;
    protected $fillable = ['name','type'];
    protected $dates = ['deleted_at'];

    protected  $casts = [
        'id' => 'string',
        'type' => 'smallInteger'
    ];

    public function modelFilter()
    {
        return $this->provideFilter(CastMemberFilter::class);
    }
}
