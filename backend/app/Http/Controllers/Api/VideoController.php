<?php

namespace App\Http\Controllers\Api;

use App\Models\Video;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use App\Rules\GenresHasCategoriesRule;
use App\Http\Resources\VideoResource;

class VideoController extends BasicCrudController
{
    private $rules;

    public function __construct()
    {
        $this->rules = [
            'title' => 'required|max:255',
            'description' => 'required',
            'year_launched' => 'required|date_format:Y|min:1',
            'opened' => 'boolean',
            'rating' => 'required|in:' . implode(',', Video::RATING_LIST),
            'duration' => 'required|integer|min:1',
            'categories_id' => 'required|array|exists:categories,id,deleted_at,NULL',
            'genres_id' => [
                'required',
                'array',
                'exists:genres,id,deleted_at,NULL'
            ],
            'cast_members_id' => [
                'required',
                'array',
                'exists:cast_members,id,deleted_at,NULL',
            ],
            'thumb_file' => 'image|mimes:jpeg,png,jpg,gif|max:' . Video::THUMB_FILE_MAX_SIZE,
            'banner_file' => 'image|mimes:jpeg,png,jpg,gif|max:' . Video::BANNER_FILE_MAX_SIZE,
            'trailer_file' => 'mimetypes:video/mp4|max:' . Video::TRAILER_FILE_MAX_SIZE,
            'video_file' => 'mimetypes:video/mp4|max:' . Video::VIDEO_FILE_MAX_SIZE,
        ];
    }

    public function store(Request $request)
    {
        $this->addRuleIfGenreHasCategories($request);
        $validateData = $this->validate($request, $this->rulesStore());
        $self = $this;
        $obj = $this->model()::create($validateData);
        $obj->refresh();
        $resource = $this->resource();
        return new $resource($obj);
    }

    public function update(Request $request, $id)
    {
        $obj = $this->findOrFail($id);
        $this->addRuleIfGenreHasCategories($request);
        $validateData = $this->validate(
            $request,
            $request->isMethod('PUT') ? $this->rulesUpdate() :
                $this->rulesPatch()
        );
        $obj->update($validateData);
        $resource = $this->resource();
        return new $resource($obj);
    }

    protected function addRuleIfGenreHasCategories(Request $request)
    {
        $categoriesId = $request->get('categories_id');
        $categoriesId = is_array($categoriesId) ? $categoriesId : [];

        $this->rules['genres_id'][] = new GenresHasCategoriesRule(
            $categoriesId
        );
    }

    protected function rulesPatch()
    {
        return array_map(function ($rules) {
            if (is_array($rules)) {
                $exists = in_array('required', $rules);
                if ($exists) {
                    array_unshift($rules, 'sometimes');
                }
            } else {
                return str_replace('required', 'sometimes|required', $rules);
            }
            return $rules;
        }, $this->rulesUpdate());
    }

    protected function model()
    {
        return Video::class;
    }

    protected function rulesStore()
    {
        return $this->rules;
    }

    protected function rulesUpdate()
    {
        return $this->rules;
    }

    protected function resource()
    {
        return VideoResource::class;
    }

    protected function resourceCollection()
    {
        return $this->resource();
    }

    protected  function queryBuilder(): Builder
    {
        $action = \Route::getCurrentRoute()->getAction()['uses'];
        return parent::queryBuilder()->with([
            strpos($action, 'index') !== false
            ? 'genres.categories'
            : 'genres.categories',
            'categories',
            'castMembers'
        ]);
    }
}
