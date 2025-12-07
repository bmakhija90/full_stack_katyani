import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productService } from '../../services/productService';
import ProductCard from './ProductCard';
import LoadingSpinner from '../common/LoadingSpinner';
import { Container, Row, Col, Form, Button, Pagination } from 'react-bootstrap';
import { toast } from 'react-toastify';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    page: parseInt(searchParams.get('page')) || 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchCategories = async () => {
    try {
      const data = await productService.getCategories();
      setCategories(data);
    } catch (error) {
      toast.error('Failed to load categories');
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await productService.getAllProducts(
        filters.category || null,
        filters.page,
        filters.limit
      );
      setProducts(data.products);
      setPagination({
        total: data.total,
        page: data.page,
        limit: data.limit,
        totalPages: data.totalPages
      });
      
      // Update URL params
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.page > 1) params.page = filters.page;
      setSearchParams(params);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (e) => {
    setFilters(prev => ({
      ...prev,
      category: e.target.value,
      page: 1
    }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({
      ...prev,
      page
    }));
    window.scrollTo(0, 0);
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      page: 1,
      limit: 20
    });
    setSearchParams({});
  };

  if (loading && products.length === 0) {
    return <LoadingSpinner message="Loading products..." />;
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col md={3}>
          <div className="card p-3">
            <h5>Filters</h5>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Category</Form.Label>
                <Form.Select 
                  value={filters.category} 
                  onChange={handleCategoryChange}
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category._id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Button 
                variant="outline-secondary" 
                onClick={clearFilters}
                className="w-100"
              >
                Clear Filters
              </Button>
            </Form>
          </div>
        </Col>
        
        <Col md={9}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>
              Products
              {filters.category && (
                <span className="text-muted fs-5 ms-2">
                  ({categories.find(c => c.slug === filters.category)?.name})
                </span>
              )}
            </h2>
            <div className="text-muted">
              Showing {(filters.page - 1) * filters.limit + 1}-
              {Math.min(filters.page * filters.limit, pagination.total)} of {pagination.total} products
            </div>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-5">
              <h4>No products found</h4>
              <p className="text-muted">Try changing your filters</p>
            </div>
          ) : (
            <>
              <Row xs={1} md={2} lg={3} className="g-4">
                {products.map(product => (
                  <Col key={product._id}>
                    <ProductCard product={product} />
                  </Col>
                ))}
              </Row>

              {pagination.totalPages > 1 && (
                <div className="d-flex justify-content-center mt-5">
                  <Pagination>
                    <Pagination.First 
                      onClick={() => handlePageChange(1)} 
                      disabled={pagination.page === 1}
                    />
                    <Pagination.Prev 
                      onClick={() => handlePageChange(pagination.page - 1)} 
                      disabled={pagination.page === 1}
                    />
                    
                    {[...Array(pagination.totalPages).keys()].map(num => {
                      const pageNum = num + 1;
                      // Show only nearby pages
                      if (
                        pageNum === 1 ||
                        pageNum === pagination.totalPages ||
                        (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
                      ) {
                        return (
                          <Pagination.Item
                            key={pageNum}
                            active={pageNum === pagination.page}
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </Pagination.Item>
                        );
                      } else if (
                        pageNum === pagination.page - 2 ||
                        pageNum === pagination.page + 2
                      ) {
                        return <Pagination.Ellipsis key={pageNum} />;
                      }
                      return null;
                    })}
                    
                    <Pagination.Next 
                      onClick={() => handlePageChange(pagination.page + 1)} 
                      disabled={pagination.page === pagination.totalPages}
                    />
                    <Pagination.Last 
                      onClick={() => handlePageChange(pagination.totalPages)} 
                      disabled={pagination.page === pagination.totalPages}
                    />
                  </Pagination>
                </div>
              )}
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default ProductList;